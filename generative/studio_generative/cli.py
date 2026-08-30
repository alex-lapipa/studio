from __future__ import annotations

import argparse
import contextlib
import asyncio
from dataclasses import asdict
import json
import os
import shlex
import signal
import sys

from .audio.output import CoreAudioOutput, list_output_devices
from .control import apply_config_value
from .lyria.provider import LyriaProvider
from .model import MusicConfig, WeightedPrompt


def _parse_prompt(value: str) -> WeightedPrompt:
    try:
        weight_text, text = value.split(":", 1)
        return WeightedPrompt(text=text.strip(), weight=float(weight_text))
    except (ValueError, TypeError) as exc:
        raise argparse.ArgumentTypeError("prompt must be WEIGHT:TEXT") from exc


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="studio-generative")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("devices", help="list stereo Mac audio outputs")
    run = sub.add_parser("run", help="connect to Lyria and open the local control shell")
    run.add_argument("--output", required=True, help="explicit CoreAudio device name or index")
    run.add_argument("--buffer-seconds", type=float, default=3.0)
    run.add_argument("--prompt", action="append", type=_parse_prompt, required=True)
    run.add_argument("--bpm", type=int)
    run.add_argument("--density", type=float)
    run.add_argument("--brightness", type=float)
    run.add_argument("--guidance", type=float, default=4.0)
    run.add_argument("--temperature", type=float, default=1.1)
    run.add_argument("--top-k", type=int, default=40)
    run.add_argument("--seed", type=int)
    run.add_argument("--scale")
    run.add_argument("--music-generation-mode", default="QUALITY")
    run.add_argument("--mute-bass", action="store_true")
    run.add_argument("--mute-drums", action="store_true")
    run.add_argument("--only-bass-and-drums", action="store_true")
    return parser


def _print_devices() -> None:
    for device in list_output_devices():
        print(
            f"{device.index:>3}  {device.name}  host={device.hostapi} "
            f"outputs={device.max_output_channels} default_rate={device.default_samplerate:g}"
        )


async def _readline(prompt: str, shutdown: asyncio.Event) -> str | None:
    loop = asyncio.get_running_loop()
    future: asyncio.Future[str] = loop.create_future()
    fd = sys.stdin.fileno()
    sys.stdout.write(prompt)
    sys.stdout.flush()

    def ready() -> None:
        if future.done():
            return
        line = sys.stdin.readline()
        future.set_result(line)

    loop.add_reader(fd, ready)
    shutdown_task = asyncio.create_task(shutdown.wait())
    try:
        done, _ = await asyncio.wait({future, shutdown_task}, return_when=asyncio.FIRST_COMPLETED)
        if shutdown_task in done:
            return None
        line = future.result()
        return line if line else None
    finally:
        loop.remove_reader(fd)
        shutdown_task.cancel()


def _api_key_from_environment() -> str:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise SystemExit(
            "GEMINI_API_KEY or GOOGLE_API_KEY is not set. Create a Gemini API key with "
            "Lyria RealTime access; do not place it in Git."
        )
    return api_key


def _status_json(provider: LyriaProvider, audio: CoreAudioOutput) -> str:
    provider_status = provider.status_snapshot()
    provider_status["config"] = asdict(provider.config)
    return json.dumps({"provider": provider_status, "audio": audio.status_snapshot()}, indent=2, sort_keys=True)


async def _run(args: argparse.Namespace) -> None:
    api_key = _api_key_from_environment()

    config = MusicConfig(
        guidance=args.guidance,
        bpm=args.bpm,
        density=args.density,
        brightness=args.brightness,
        scale=args.scale,
        temperature=args.temperature,
        top_k=args.top_k,
        seed=args.seed,
        mute_bass=args.mute_bass,
        mute_drums=args.mute_drums,
        only_bass_and_drums=args.only_bass_and_drums,
        music_generation_mode=args.music_generation_mode,
    )
    config.validate()
    audio = CoreAudioOutput(args.output, buffer_seconds=args.buffer_seconds)
    provider = LyriaProvider(api_key)
    shutdown = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        with contextlib.suppress(NotImplementedError):
            loop.add_signal_handler(sig, shutdown.set)

    def status(message: str) -> None:
        print(f"\n[lyria] {message}")

    audio.start()
    try:
        await provider.connect(audio.push, status)
        await provider.set_prompts(args.prompt)
        await provider.set_config(config)
        print("Connected. Type 'help' for controls; generation is stopped until 'play'.")
        while not shutdown.is_set():
            line = await _readline("lyria> ", shutdown)
            if line is None:
                break
            parts = shlex.split(line)
            if not parts:
                continue
            command = parts[0].lower()
            try:
                if command in {"quit", "exit"}:
                    break
                if command == "help":
                    print("play | pause | stop | reset | prompt WEIGHT TEXT | prompts | set NAME VALUE | status | quit")
                elif command == "play":
                    await provider.play()
                elif command == "pause":
                    await provider.pause()
                elif command == "stop":
                    await provider.stop()
                    audio.buffer.clear()
                elif command == "reset":
                    await provider.reset_context()
                    audio.buffer.clear()
                elif command == "prompt" and len(parts) >= 3:
                    await provider.set_prompts([WeightedPrompt(" ".join(parts[2:]), float(parts[1]))])
                elif command == "prompts":
                    for prompt in provider.prompts:
                        print(f"{prompt.weight:g}: {prompt.text}")
                elif command == "set" and len(parts) == 3:
                    config = await apply_config_value(provider, config, parts[1], parts[2])
                elif command == "status":
                    print(_status_json(provider, audio))
                else:
                    print("Unknown command; type 'help'.")
            except (ValueError, RuntimeError) as exc:
                print(f"error: {exc}")
    finally:
        await provider.close()
        audio.close()
        for sig in (signal.SIGINT, signal.SIGTERM):
            with contextlib.suppress(NotImplementedError):
                loop.remove_signal_handler(sig)


def main() -> None:
    args = _parser().parse_args()
    if args.command == "devices":
        _print_devices()
        return
    asyncio.run(_run(args))


if __name__ == "__main__":
    main()

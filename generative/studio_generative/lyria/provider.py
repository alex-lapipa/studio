from __future__ import annotations

import asyncio
import contextlib

from google import genai
from google.genai import types

from ..model import AudioCallback, MusicConfig, StatusCallback, Transport, WeightedPrompt

MODEL = "models/lyria-realtime-exp"
API_VERSION = "v1alpha"


class LyriaProvider:
    def __init__(self, api_key: str) -> None:
        if not api_key:
            raise ValueError("A Gemini API key is required")
        self._client = genai.Client(api_key=api_key, http_options={"api_version": API_VERSION})
        self._session_cm = None
        self._session = None
        self._receive_task: asyncio.Task[None] | None = None
        self._on_audio: AudioCallback | None = None
        self._on_status: StatusCallback = lambda _: None
        self._closing = False
        self.prompts: list[WeightedPrompt] = []
        self.config = MusicConfig()
        self.transport = Transport.STOPPED
        self.audio_chunks_received = 0
        self.audio_bytes_received = 0
        self.reconnect_count = 0

    async def connect(self, on_audio: AudioCallback, on_status: StatusCallback) -> None:
        self._on_audio = on_audio
        self._on_status = on_status
        self._closing = False
        await self._open_session()
        self._receive_task = asyncio.create_task(self._receive_loop(), name="lyria-receive")

    async def close(self) -> None:
        self._closing = True
        if self._receive_task is not None:
            self._receive_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._receive_task
            self._receive_task = None
        await self._close_session()
        await self._client.aio.aclose()
        self._on_status("closed")

    async def play(self) -> None:
        await self._require_session().play()
        self.transport = Transport.PLAYING

    async def pause(self) -> None:
        await self._require_session().pause()
        self.transport = Transport.PAUSED

    async def stop(self) -> None:
        await self._require_session().stop()
        self.transport = Transport.STOPPED

    async def reset_context(self) -> None:
        await self._require_session().reset_context()

    async def set_prompts(self, prompts: list[WeightedPrompt]) -> None:
        if not prompts:
            raise ValueError("At least one weighted prompt is required")
        candidate = list(prompts)
        await self._require_session().set_weighted_prompts(
            [types.WeightedPrompt(text=p.text, weight=p.weight) for p in candidate]
        )
        self.prompts = candidate

    async def set_config(self, config: MusicConfig) -> None:
        config.validate()
        scale = types.Scale(config.scale) if config.scale else None
        mode = types.MusicGenerationMode(config.music_generation_mode)
        await self._require_session().set_music_generation_config(
            types.LiveMusicGenerationConfig(
                guidance=config.guidance,
                bpm=config.bpm,
                density=config.density,
                brightness=config.brightness,
                scale=scale,
                temperature=config.temperature,
                top_k=config.top_k,
                seed=config.seed,
                mute_bass=config.mute_bass,
                mute_drums=config.mute_drums,
                only_bass_and_drums=config.only_bass_and_drums,
                music_generation_mode=mode,
            )
        )
        self.config = config

    async def _open_session(self) -> None:
        self._session_cm = self._client.aio.live.music.connect(model=MODEL)
        self._session = await self._session_cm.__aenter__()
        self._on_status(f"connected:{MODEL}:{API_VERSION}")

    async def _close_session(self) -> None:
        if self._session_cm is not None:
            with contextlib.suppress(Exception):
                await self._session_cm.__aexit__(None, None, None)
        self._session_cm = None
        self._session = None

    async def _receive_loop(self) -> None:
        backoff = 1.0
        while not self._closing:
            try:
                async for message in self._require_session().receive():
                    filtered = getattr(message, "filtered_prompt", None)
                    if filtered:
                        self._on_status(
                            f"filtered_prompt:{getattr(filtered, 'text', '')}:"
                            f"{getattr(filtered, 'filtered_reason', '')}"
                        )
                    content = getattr(message, "server_content", None)
                    chunks = getattr(content, "audio_chunks", None) if content else None
                    if chunks and self._on_audio:
                        for chunk in chunks:
                            data = getattr(chunk, "data", None)
                            if data:
                                self.audio_chunks_received += 1
                                self.audio_bytes_received += len(data)
                                self._on_audio(data)
                raise ConnectionError("Lyria stream ended")
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                if self._closing:
                    return
                self._on_status(f"stream_error:{type(exc).__name__}:{exc}")
                await self._close_session()
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2.0, 15.0)
                try:
                    await self._open_session()
                    await self._restore_state()
                    self.reconnect_count += 1
                    backoff = 1.0
                    self._on_status("reconnected")
                except Exception as reconnect_exc:
                    self._on_status(
                        f"reconnect_error:{type(reconnect_exc).__name__}:{reconnect_exc}"
                    )

    async def _restore_state(self) -> None:
        if self.prompts:
            await self.set_prompts(self.prompts)
        await self.set_config(self.config)
        if self.transport is Transport.PLAYING:
            await self._require_session().play()
        elif self.transport is Transport.PAUSED:
            await self._require_session().play()
            await self._require_session().pause()

    def status_snapshot(self) -> dict[str, object]:
        return {
            "model": MODEL,
            "api_version": API_VERSION,
            "connected": self._session is not None,
            "transport": self.transport.value,
            "prompts": [{"text": p.text, "weight": p.weight} for p in self.prompts],
            "config": self.config,
            "audio_chunks_received": self.audio_chunks_received,
            "audio_bytes_received": self.audio_bytes_received,
            "reconnect_count": self.reconnect_count,
        }

    def _require_session(self):
        if self._session is None:
            raise RuntimeError("Lyria session is not connected")
        return self._session

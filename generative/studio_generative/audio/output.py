from __future__ import annotations

from dataclasses import dataclass

import sounddevice as sd

from ..model import PCM_CHANNELS, PCM_SAMPLE_RATE, PCM_SAMPLE_WIDTH_BYTES
from .ring import PcmRingBuffer


@dataclass(frozen=True, slots=True)
class OutputDevice:
    index: int
    name: str
    hostapi: str
    max_output_channels: int
    default_samplerate: float


def list_output_devices() -> list[OutputDevice]:
    devices: list[OutputDevice] = []
    for index, info in enumerate(sd.query_devices()):
        channels = int(info["max_output_channels"])
        if channels >= PCM_CHANNELS:
            hostapi = str(sd.query_hostapis(int(info["hostapi"]))["name"])
            devices.append(
                OutputDevice(
                    index=index,
                    name=str(info["name"]),
                    hostapi=hostapi,
                    max_output_channels=channels,
                    default_samplerate=float(info["default_samplerate"]),
                )
            )
    return devices


def resolve_output_device(selector: str) -> OutputDevice:
    devices = list_output_devices()
    if selector.isdigit():
        wanted = int(selector)
        for device in devices:
            if device.index == wanted:
                return device
    exact = [device for device in devices if device.name == selector]
    if len(exact) == 1:
        return exact[0]
    partial = [device for device in devices if selector.lower() in device.name.lower()]
    if len(partial) == 1:
        return partial[0]
    if not exact and not partial:
        raise ValueError(f"No stereo output device matches {selector!r}")
    names = ", ".join(f"{d.index}:{d.name}" for d in partial or exact)
    raise ValueError(f"Output selector is ambiguous: {names}")


class CoreAudioOutput:
    def __init__(self, selector: str, buffer_seconds: float = 3.0) -> None:
        if buffer_seconds <= 0:
            raise ValueError("buffer_seconds must be positive")
        self.device = resolve_output_device(selector)
        if self.device.hostapi != "Core Audio":
            raise ValueError(f"Selected device is not Core Audio: {self.device.hostapi}")
        capacity = int(PCM_SAMPLE_RATE * PCM_CHANNELS * PCM_SAMPLE_WIDTH_BYTES * buffer_seconds)
        self.buffer = PcmRingBuffer(capacity)
        self._stream: sd.RawOutputStream | None = None
        self.callback_status_count = 0

    def start(self) -> None:
        if self._stream is not None:
            return
        sd.check_output_settings(
            device=self.device.index,
            channels=PCM_CHANNELS,
            dtype="int16",
            samplerate=PCM_SAMPLE_RATE,
        )
        self._stream = sd.RawOutputStream(
            device=self.device.index,
            samplerate=PCM_SAMPLE_RATE,
            channels=PCM_CHANNELS,
            dtype="int16",
            callback=self._callback,
            blocksize=0,
        )
        self._stream.start()

    def push(self, pcm: bytes) -> None:
        self.buffer.write(pcm)

    def status_snapshot(self) -> dict[str, object]:
        return {
            "device": {"index": self.device.index, "name": self.device.name, "hostapi": self.device.hostapi},
            "sample_rate": PCM_SAMPLE_RATE,
            "channels": PCM_CHANNELS,
            "buffer_bytes": self.buffer.size,
            "buffer_capacity_bytes": self.buffer.capacity,
            "dropped_bytes": self.buffer.dropped_bytes,
            "underrun_bytes": self.buffer.underrun_bytes,
            "callback_status_count": self.callback_status_count,
            "active": self._stream is not None,
        }

    def close(self) -> None:
        stream, self._stream = self._stream, None
        if stream is not None:
            stream.stop()
            stream.close()
        self.buffer.clear()

    def _callback(self, outdata: memoryview, frames: int, time_info: object, status: object) -> None:
        del time_info
        if status:
            self.callback_status_count += 1
        byte_count = frames * PCM_CHANNELS * PCM_SAMPLE_WIDTH_BYTES
        outdata[:] = self.buffer.read(byte_count)

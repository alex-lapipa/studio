from __future__ import annotations

from collections import deque
from threading import Lock


class PcmRingBuffer:
    def __init__(self, capacity_bytes: int) -> None:
        if capacity_bytes <= 0:
            raise ValueError("capacity_bytes must be positive")
        self.capacity = capacity_bytes
        self._chunks: deque[bytes] = deque()
        self._head_offset = 0
        self._size = 0
        self._lock = Lock()
        self.dropped_bytes = 0
        self.underrun_bytes = 0

    @property
    def size(self) -> int:
        with self._lock:
            return self._size

    def clear(self) -> None:
        with self._lock:
            self._chunks.clear()
            self._head_offset = 0
            self._size = 0

    def write(self, data: bytes) -> None:
        if not data:
            return
        incoming = bytes(data)
        with self._lock:
            if len(incoming) >= self.capacity:
                self.dropped_bytes += self._size + len(incoming) - self.capacity
                self._chunks.clear()
                self._head_offset = 0
                incoming = incoming[-self.capacity :]
                self._size = 0
            overflow = self._size + len(incoming) - self.capacity
            if overflow > 0:
                self._discard_locked(overflow)
                self.dropped_bytes += overflow
            self._chunks.append(incoming)
            self._size += len(incoming)

    def read(self, byte_count: int) -> bytes:
        if byte_count <= 0:
            return b""
        out = bytearray()
        with self._lock:
            take = min(byte_count, self._size)
            remaining = take
            while remaining and self._chunks:
                head = self._chunks[0]
                available = len(head) - self._head_offset
                n = min(remaining, available)
                out += head[self._head_offset : self._head_offset + n]
                self._head_offset += n
                self._size -= n
                remaining -= n
                if self._head_offset == len(head):
                    self._chunks.popleft()
                    self._head_offset = 0
            missing = byte_count - take
            if missing:
                self.underrun_bytes += missing
                out += b"\x00" * missing
        return bytes(out)

    def _discard_locked(self, byte_count: int) -> None:
        remaining = min(byte_count, self._size)
        while remaining and self._chunks:
            head = self._chunks[0]
            available = len(head) - self._head_offset
            n = min(remaining, available)
            self._head_offset += n
            self._size -= n
            remaining -= n
            if self._head_offset == len(head):
                self._chunks.popleft()
                self._head_offset = 0

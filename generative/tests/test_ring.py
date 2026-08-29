from studio_generative.audio.ring import PcmRingBuffer


def test_ring_reads_in_order_and_zero_fills() -> None:
    ring = PcmRingBuffer(16)
    ring.write(b"abcdef")
    assert ring.read(4) == b"abcd"
    assert ring.read(4) == b"ef\x00\x00"
    assert ring.underrun_bytes == 2


def test_ring_drops_oldest_on_overflow() -> None:
    ring = PcmRingBuffer(6)
    ring.write(b"abcd")
    ring.write(b"efgh")
    assert ring.read(6) == b"cdefgh"
    assert ring.dropped_bytes == 2


def test_ring_keeps_tail_of_oversized_chunk() -> None:
    ring = PcmRingBuffer(4)
    ring.write(b"abcdefgh")
    assert ring.read(4) == b"efgh"
    assert ring.dropped_bytes == 4

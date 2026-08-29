from studio_generative.lyria.provider import API_VERSION, MODEL
from studio_generative.model import PCM_CHANNELS, PCM_SAMPLE_RATE, PCM_SAMPLE_WIDTH_BYTES


def test_google_realtime_contract_constants() -> None:
    assert MODEL == "models/lyria-realtime-exp"
    assert API_VERSION == "v1alpha"
    assert PCM_SAMPLE_RATE == 48_000
    assert PCM_CHANNELS == 2
    assert PCM_SAMPLE_WIDTH_BYTES == 2

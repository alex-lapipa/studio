import pytest

from studio_generative import cli


def test_api_key_prefers_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gemini")
    monkeypatch.setenv("GOOGLE_API_KEY", "google")
    assert cli._api_key_from_environment() == "gemini"


def test_api_key_accepts_google_fallback(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GOOGLE_API_KEY", "google")
    assert cli._api_key_from_environment() == "google"


def test_api_key_is_required(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    with pytest.raises(SystemExit, match="GEMINI_API_KEY or GOOGLE_API_KEY"):
        cli._api_key_from_environment()

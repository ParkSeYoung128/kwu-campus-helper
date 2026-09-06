"""
cafeteria.py 유닛 테스트.

주의: 이 테스트는 실제 kw.ac.kr 페이지나 OpenAI API를 호출하지 않는다.
LLMExtractCafeteriaProvider의 fetch/추출 단계는 monkeypatch로 대체해서
"캐싱 정책"과 "실패 시 폴백 정책"만 검증한다. 실제 API 키를 사용한
라이브 호출 검증은 이 테스트 스위트의 범위 밖이며, 세영님이 직접
OPENAI_API_KEY를 넣고 실행해서 확인해야 한다.
"""
import os

import pytest

from cafeteria import (
    CafeteriaExtractionError,
    CafeteriaMenu,
    CafeteriaMeals,
    LLMExtractCafeteriaProvider,
    MockCafeteriaMenuProvider,
    get_default_provider,
)


def _sample_menu(date="2026-09-07"):
    return CafeteriaMenu(date=date, meals=CafeteriaMeals(lunch=["된장찌개", "밥"]))


def test_mock_provider_returns_given_menus():
    menus = [_sample_menu()]
    provider = MockCafeteriaMenuProvider(menus)
    assert provider.get_week_menu() == menus


def test_mock_provider_defaults_to_empty_list():
    provider = MockCafeteriaMenuProvider()
    assert provider.get_week_menu() == []


def test_get_default_provider_is_mock_when_env_unset(monkeypatch):
    monkeypatch.delenv("CAFETERIA_PROVIDER", raising=False)
    provider = get_default_provider()
    assert isinstance(provider, MockCafeteriaMenuProvider)


def test_get_default_provider_is_llm_when_env_set_to_llm(monkeypatch):
    monkeypatch.setenv("CAFETERIA_PROVIDER", "llm")
    provider = get_default_provider()
    assert isinstance(provider, LLMExtractCafeteriaProvider)


def test_llm_provider_caches_result_within_ttl(monkeypatch):
    provider = LLMExtractCafeteriaProvider(api_key="dummy", cache_ttl_seconds=3600)
    call_count = {"n": 0}

    def fake_fetch_page(self):
        call_count["n"] += 1
        return "<html>...</html>"

    def fake_extract(self, html):
        return [_sample_menu()]

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", fake_fetch_page)
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_extract_with_llm", fake_extract)

    first = provider.get_week_menu()
    second = provider.get_week_menu()

    assert first == second == [_sample_menu()]
    # ttl 안에 두 번 호출했으므로 실제 fetch는 한 번만 일어나야 한다(캐시 검증).
    assert call_count["n"] == 1


def test_llm_provider_refetches_after_ttl_expires(monkeypatch):
    provider = LLMExtractCafeteriaProvider(api_key="dummy", cache_ttl_seconds=0)
    call_count = {"n": 0}

    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>"
    )
    monkeypatch.setattr(
        LLMExtractCafeteriaProvider,
        "_extract_with_llm",
        lambda self, html: [_sample_menu()] if not call_count["n"] else [_sample_menu("2026-09-08")],
    )

    def counting_fetch(self):
        call_count["n"] += 1
        return "<html/>"

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", counting_fetch)

    provider.get_week_menu()
    provider.get_week_menu()
    # cache_ttl_seconds=0이므로 매번 다시 fetch해야 한다.
    assert call_count["n"] == 2


def test_llm_provider_falls_back_to_last_cache_on_failure(monkeypatch):
    provider = LLMExtractCafeteriaProvider(api_key="dummy", cache_ttl_seconds=0)

    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>"
    )
    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_extract_with_llm", lambda self, html: [_sample_menu()]
    )

    first = provider.get_week_menu()
    assert first == [_sample_menu()]

    def failing_fetch(self):
        raise RuntimeError("네트워크 실패 시뮬레이션")

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", failing_fetch)

    # 두 번째 호출은 fetch가 실패하지만, 직전 캐시가 있으므로 예외 대신
    # 캐시된 값을 그대로 반환해야 한다(엔드포인트가 500으로 죽지 않도록).
    second = provider.get_week_menu()
    assert second == first


def test_llm_provider_raises_when_no_cache_and_fetch_fails(monkeypatch):
    provider = LLMExtractCafeteriaProvider(api_key="dummy")

    def failing_fetch(self):
        raise RuntimeError("네트워크 실패 시뮬레이션")

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", failing_fetch)

    # 캐시가 아예 없는 상태(첫 호출)에서 실패하면 명시적으로 예외를 던져야
    # 엔드포인트가 502로 변환할 수 있다.
    with pytest.raises(CafeteriaExtractionError):
        provider.get_week_menu()


def test_llm_provider_raises_when_api_key_missing(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    provider = LLMExtractCafeteriaProvider(api_key=None)

    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>"
    )

    with pytest.raises(CafeteriaExtractionError):
        provider.get_week_menu()

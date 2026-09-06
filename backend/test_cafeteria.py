"""
cafeteria.py 유닛 테스트.

주의: 이 테스트는 실제 kw.ac.kr 페이지나 OpenAI API를 호출하지 않는다.
LLMExtractCafeteriaProvider의 fetch/추출 단계는 monkeypatch로 대체해서
"캐싱 정책"과 "실패 시 폴백 정책"만 검증한다. 실제 API 키를 사용한
라이브 호출 검증은 이 테스트 스위트의 범위 밖이며, 세영님이 직접
OPENAI_API_KEY를 넣고 실행해서 확인해야 한다.
"""
import json
import os
import threading
import time as time_module

import pytest

from cafeteria import (
    CafeteriaExtractionError,
    CafeteriaMenu,
    CafeteriaMeals,
    LLMExtractCafeteriaProvider,
    MockCafeteriaMenuProvider,
    _html_to_text,
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


# ---------- CodeRabbit 리뷰 반영: 날짜 타입, 동시성, 타임아웃, 잘못된 truncation ----------
def test_html_to_text_strips_scripts_and_styles_but_keeps_visible_text():
    html = (
        "<html><head><script>var x = 1;</script><style>.a{color:red}</style></head>"
        "<body><p>월요일 중식: 된장찌개</p></body></html>"
    )
    text = _html_to_text(html)
    assert "var x = 1" not in text
    assert "color:red" not in text
    assert "월요일 중식: 된장찌개" in text


def test_llm_provider_rejects_non_date_string_from_llm(monkeypatch):
    """LLM이 "월요일" 같은 비-날짜 문자열을 date로 반환하면 CafeteriaMenu 생성
    단계(pydantic date 검증)에서 실패해야 하고, 이 실패는 500이 아니라
    CafeteriaExtractionError로 이어져야 한다(캐시가 없는 경우)."""
    provider = LLMExtractCafeteriaProvider(api_key="dummy")
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>")

    def fake_extract(self, html):
        # 실제 _extract_with_llm과 동일하게, 여기서 CafeteriaMenu(date=...) 생성 시
        # pydantic이 "월요일"을 date로 파싱하지 못해 예외를 던진다.
        return [CafeteriaMenu(date="월요일", meals=CafeteriaMeals(lunch=["된장찌개"]))]

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_extract_with_llm", fake_extract)

    with pytest.raises(CafeteriaExtractionError):
        provider.get_week_menu()


def test_llm_provider_rejects_empty_extraction_and_keeps_old_cache(monkeypatch):
    """추출 결과가 빈 배열이면(예: 입력이 잘못 잘려 메뉴 부분이 아예 없었던 경우)
    그걸 성공으로 캐싱하면 안 되고, 직전 캐시가 있으면 그걸 유지해야 한다."""
    provider = LLMExtractCafeteriaProvider(api_key="dummy", cache_ttl_seconds=0)
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>")
    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_extract_with_llm", lambda self, html: [_sample_menu()]
    )

    first = provider.get_week_menu()
    assert first == [_sample_menu()]

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_extract_with_llm", lambda self, html: [])

    second = provider.get_week_menu()
    assert second == first


def test_llm_provider_raises_when_first_extraction_is_empty_and_no_cache(monkeypatch):
    provider = LLMExtractCafeteriaProvider(api_key="dummy")
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html/>")
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_extract_with_llm", lambda self, html: [])

    with pytest.raises(CafeteriaExtractionError):
        provider.get_week_menu()


def test_llm_provider_serializes_concurrent_cache_misses(monkeypatch):
    """캐시가 없는 상태에서 동시에 여러 요청이 들어와도 실제 fetch는 한 번만
    일어나야 한다(single-flight). 락이 없으면 각 스레드가 캐시 체크를 통과해
    fetch+LLM 호출을 중복 실행하게 된다."""
    provider = LLMExtractCafeteriaProvider(api_key="dummy", cache_ttl_seconds=3600)
    call_count = {"n": 0}
    count_lock = threading.Lock()

    def slow_fetch(self):
        with count_lock:
            call_count["n"] += 1
        time_module.sleep(0.05)
        return "<html/>"

    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", slow_fetch)
    monkeypatch.setattr(
        LLMExtractCafeteriaProvider, "_extract_with_llm", lambda self, html: [_sample_menu()]
    )

    threads = [threading.Thread(target=provider.get_week_menu) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert call_count["n"] == 1


def test_llm_provider_configures_openai_client_with_bounded_timeout_and_no_retries(monkeypatch):
    """openai 기본값(timeout=600초, max_retries=2)을 그대로 쓰면 장애 시 캐시
    폴백까지 너무 오래 걸린다. 엔드포인트에 맞는 짧은 timeout과 재시도 없음을
    명시적으로 넘기는지 확인한다."""
    import openai as openai_module

    captured = {}

    class FakeMessage:
        content = json.dumps({"days": []})

    class FakeChoice:
        message = FakeMessage()

    class FakeCompletion:
        choices = [FakeChoice()]

    class FakeCompletions:
        def create(self, **kwargs):
            return FakeCompletion()

    class FakeChat:
        completions = FakeCompletions()

    class FakeOpenAI:
        def __init__(self, **kwargs):
            captured.update(kwargs)
            self.chat = FakeChat()

    monkeypatch.setattr(openai_module, "OpenAI", FakeOpenAI)

    provider = LLMExtractCafeteriaProvider(api_key="dummy")
    monkeypatch.setattr(LLMExtractCafeteriaProvider, "_fetch_page", lambda self: "<html>메뉴</html>")

    # days=[]라서 결국 CafeteriaExtractionError가 나지만, 여기서 검증하려는 건
    # OpenAI 클라이언트 생성 시 넘긴 kwargs이므로 그 예외 자체는 무시한다.
    with pytest.raises(CafeteriaExtractionError):
        provider.get_week_menu()

    assert captured.get("timeout") == 20.0
    assert captured.get("max_retries") == 0


from __future__ import annotations

import json
import os
import time
from abc import ABC, abstractmethod
from typing import List, Optional

import httpx
from pydantic import BaseModel


# ---------- 응답 모델 (프론트엔드 src/types/index.ts의 CafeteriaMenu와 동일한 형태) ----------
class CafeteriaMeals(BaseModel):
    breakfast: Optional[List[str]] = None
    lunch: Optional[List[str]] = None
    dinner: Optional[List[str]] = None


class CafeteriaMenu(BaseModel):
    date: str  # YYYY-MM-DD
    meals: CafeteriaMeals


class CafeteriaExtractionError(Exception):
    """원본 페이지 fetch 또는 LLM 추출 과정에서 실패했을 때 발생한다."""


# ---------- Provider 인터페이스 ----------
class CafeteriaMenuProvider(ABC):
    """학식 메뉴 데이터를 얻어오는 방법을 추상화하는 인터페이스.

    엔드포인트는 이 인터페이스에만 의존하므로, 실제 구현(LLM 추출,
    향후 다른 스크래퍼, 목업 등)을 endpoint 코드 변경 없이 갈아끼울 수 있다.
    """

    @abstractmethod
    def get_week_menu(self) -> List[CafeteriaMenu]:
        raise NotImplementedError


class MockCafeteriaMenuProvider(CafeteriaMenuProvider):
    """테스트/로컬 개발용 더미 데이터 provider. 외부 호출이 전혀 없다."""

    def __init__(self, menus: Optional[List[CafeteriaMenu]] = None):
        self._menus = menus if menus is not None else []

    def get_week_menu(self) -> List[CafeteriaMenu]:
        return self._menus


SOURCE_URL = "https://www.kw.ac.kr/ko/life/facility11.jsp"

# OpenAI Structured Outputs(JSON Schema strict mode)에 사용할 스키마.
# 요일별로 date(YYYY-MM-DD)와 아침/중식/석식 메뉴 배열을 추출하도록 강제한다.
EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "days": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "YYYY-MM-DD 형식"},
                    "breakfast": {"type": "array", "items": {"type": "string"}},
                    "lunch": {"type": "array", "items": {"type": "string"}},
                    "dinner": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["date", "breakfast", "lunch", "dinner"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["days"],
    "additionalProperties": False,
}


class LLMExtractCafeteriaProvider(CafeteriaMenuProvider):
    """광운대 학식 페이지를 백엔드가 직접 fetch한 뒤, OpenAI로 구조화 추출하는 provider.

    설계 의도:
    - "AI가 알아서 페이지를 찾아 가져오게" 맡기지 않는다. 대상 URL(source_url)은
      우리가 코드로 직접 지정하고 fetch도 백엔드가 httpx로 수행한다.
    - LLM은 "이미 가져온 HTML 텍스트를 정해진 JSON 스키마로 추출"하는 역할만
      맡는다. 그래서 페이지의 HTML 구조가 바뀌어도(정규식/CSS 셀렉터와 달리)
      비교적 유연하게 대응할 수 있다.
    - 최대 cache_ttl_seconds(기본 1일)에 한 번만 실제 fetch+LLM 호출을 한다.
      매 요청마다 호출하면 (1) kw.ac.kr에 불필요한 부하를 주고 (2) OpenAI API
      비용이 요청 수에 비례해 계속 발생하기 때문이다.
    - fetch 또는 LLM 호출이 실패하면 500으로 죽지 않고, 직전에 성공한 캐시가
      있으면 그것을 그대로 반환한다. 캐시조차 없으면 CafeteriaExtractionError를
      던지고, 엔드포인트에서 502로 변환한다(호출자가 "일시적으로 원본을
      가져올 수 없다"를 구분할 수 있도록).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        source_url: str = SOURCE_URL,
        cache_ttl_seconds: int = 24 * 60 * 60,
        model: str = "gpt-4o-mini",
    ):
        # 생성 시점에는 키가 없어도 예외를 던지지 않는다(예: CAFETERIA_PROVIDER=mock인
        # 환경에서 이 클래스를 아예 만들지 않으므로 상관없지만, 혹시 몰라 방어적으로 지연 검증한다).
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._source_url = source_url
        self._cache_ttl_seconds = cache_ttl_seconds
        self._model = model
        self._cache: Optional[List[CafeteriaMenu]] = None
        self._cache_at: float = 0.0

    def get_week_menu(self) -> List[CafeteriaMenu]:
        now = time.time()
        if self._cache is not None and (now - self._cache_at) < self._cache_ttl_seconds:
            return self._cache

        try:
            html = self._fetch_page()
            menus = self._extract_with_llm(html)
            self._cache = menus
            self._cache_at = now
            return menus
        except Exception as exc:  # noqa: BLE001 - 원인과 무관하게 캐시 폴백을 우선한다
            if self._cache is not None:
                return self._cache
            raise CafeteriaExtractionError(str(exc)) from exc

    def _fetch_page(self) -> str:
        resp = httpx.get(self._source_url, timeout=10.0)
        resp.raise_for_status()
        return resp.text

    def _extract_with_llm(self, html: str) -> List[CafeteriaMenu]:
        if not self._api_key:
            raise CafeteriaExtractionError("OPENAI_API_KEY가 설정되지 않았습니다.")

        # 지연 import: OPENAI_API_KEY가 없는 환경(기본 mock provider, 테스트 등)에서는
        # openai 패키지를 아예 로드하지 않도록 한다.
        from openai import OpenAI

        client = OpenAI(api_key=self._api_key)
        completion = client.chat.completions.create(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "너는 대학교 학식 페이지 HTML에서 요일별 식단을 추출하는 도구다. "
                        "주어진 HTML에서 이번 주 평일(월~금)의 아침/중식/석식 메뉴를 찾아 "
                        "지정된 JSON 스키마로만 응답해라. 해당하는 항목이 없으면 빈 배열로 남겨라."
                    ),
                },
                {"role": "user", "content": html[:20000]},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "cafeteria_week",
                    "schema": EXTRACTION_SCHEMA,
                    "strict": True,
                },
            },
        )
        content = completion.choices[0].message.content
        data = json.loads(content)
        return [
            CafeteriaMenu(
                date=day["date"],
                meals=CafeteriaMeals(
                    breakfast=day.get("breakfast") or None,
                    lunch=day.get("lunch") or None,
                    dinner=day.get("dinner") or None,
                ),
            )
            for day in data.get("days", [])
        ]


def get_default_provider() -> CafeteriaMenuProvider:
    """환경 변수 CAFETERIA_PROVIDER로 provider를 선택한다.

    - (미설정 또는) "mock": 더미 데이터. OPENAI_API_KEY 없이도 항상 동작하므로
      로컬 개발/CI의 기본값으로 안전하다.
    - "llm": 실제 kw.ac.kr fetch + OpenAI 구조화 추출. OPENAI_API_KEY 환경 변수가
      필요하다.
    """
    provider = os.environ.get("CAFETERIA_PROVIDER", "mock").lower()
    if provider == "llm":
        return LLMExtractCafeteriaProvider()
    return MockCafeteriaMenuProvider()

from __future__ import annotations

import json
import os
import re
import threading
import time
from abc import ABC, abstractmethod
from datetime import date as Date
from typing import List, Optional

import httpx
from pydantic import BaseModel


# ---------- 응답 모델 (프론트엔드 src/types/index.ts의 CafeteriaMenu와 동일한 형태) ----------
class CafeteriaMeals(BaseModel):
    breakfast: Optional[List[str]] = None
    lunch: Optional[List[str]] = None
    dinner: Optional[List[str]] = None


class CafeteriaMenu(BaseModel):
    # date 타입으로 강제한다. LLM이 "월요일" 같은 비-날짜 문자열을 반환해도
    # pydantic 검증 단계에서 즉시 실패하게 만들어, 잘못된 데이터가 캐시나
    # 응답까지 흘러가는 것을 막는다. FastAPI가 JSON 직렬화 시 자동으로
    # "YYYY-MM-DD" 문자열로 내보내므로 프론트엔드 계약(date: string)은 그대로 유지된다.
    date: Date
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
# (실제 타입 강제는 CafeteriaMenu 쪽 pydantic date 필드가 최종적으로 담당한다 -
#  JSON Schema의 "string"은 형식까지 검증하지 않으므로.)
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

_SCRIPT_OR_STYLE = re.compile(r"<(script|style)[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
_TAG = re.compile(r"<[^>]+>")
_WHITESPACE = re.compile(r"[ \t ]+")


def _html_to_text(html: str) -> str:
    """LLM에 넘기기 전에 HTML을 정제한다.

    <script>/<style> 내용과 태그를 제거해서 (1) 토큰 낭비를 줄이고
    (2) 페이지 앞부분의 스크립트/내비게이션 때문에 실제 메뉴 내용이
    글자 수 제한 밖으로 밀려나는 문제를 방지한다. 단순 html[:N] 같은
    "앞에서부터 N글자" 방식은 메뉴 테이블이 페이지 뒷부분에 있으면
    항상 빈 결과만 낳을 수 있어 사용하지 않는다.
    """
    text = _SCRIPT_OR_STYLE.sub(" ", html)
    text = _TAG.sub(" ", text)
    text = _WHITESPACE.sub(" ", text)
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)


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
    - 캐시 갱신은 락으로 직렬화한다(single-flight). 락이 없으면 캐시 만료
      직후 동시에 들어온 요청들이 전부 캐시 체크를 통과해 각자 fetch+LLM
      호출을 중복 실행하게 된다.
    - fetch/LLM 호출이 실패하거나 결과가 비어 있으면(= 잘못 잘린 입력 등으로
      추출 실패) 500으로 죽지 않고 직전에 성공한 캐시를 그대로 반환한다.
      캐시조차 없으면 CafeteriaExtractionError를 던지고, 엔드포인트에서
      502로 변환한다.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        source_url: str = SOURCE_URL,
        cache_ttl_seconds: int = 24 * 60 * 60,
        model: str = "gpt-4o-mini",
        request_timeout_seconds: float = 20.0,
    ):
        # 생성 시점에는 키가 없어도 예외를 던지지 않는다(예: CAFETERIA_PROVIDER=mock인
        # 환경에서 이 클래스를 아예 만들지 않으므로 상관없지만, 혹시 몰라 방어적으로 지연 검증한다).
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self._source_url = source_url
        self._cache_ttl_seconds = cache_ttl_seconds
        self._model = model
        self._request_timeout_seconds = request_timeout_seconds
        self._cache: Optional[List[CafeteriaMenu]] = None
        self._cache_at: float = 0.0
        self._lock = threading.Lock()

    def get_week_menu(self) -> List[CafeteriaMenu]:
        # 락 밖에서 먼저 확인(빠른 경로): 캐시가 유효하면 대부분의 요청은
        # 락을 기다릴 필요 없이 바로 반환된다.
        cached = self._read_cache_if_fresh()
        if cached is not None:
            return cached

        with self._lock:
            # double-checked locking: 락을 기다리는 동안 다른 스레드가 이미
            # 갱신을 끝냈을 수 있으므로 다시 한 번 확인한다(single-flight).
            cached = self._read_cache_if_fresh()
            if cached is not None:
                return cached

            try:
                html = self._fetch_page()
                menus = self._extract_with_llm(html)
                if not menus:
                    raise CafeteriaExtractionError(
                        "LLM 추출 결과가 비어 있습니다(days=[]). 원본 텍스트가 잘렸거나 "
                        "페이지 구조가 예상과 달라졌을 수 있습니다."
                    )
                self._cache = menus
                self._cache_at = time.time()
                return menus
            except Exception as exc:  # noqa: BLE001 - 원인과 무관하게 캐시 폴백을 우선한다
                if self._cache is not None:
                    return self._cache
                raise CafeteriaExtractionError(str(exc)) from exc

    def _read_cache_if_fresh(self) -> Optional[List[CafeteriaMenu]]:
        if self._cache is None:
            return None
        if (time.time() - self._cache_at) < self._cache_ttl_seconds:
            return self._cache
        return None

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

        # timeout/max_retries를 명시한다. openai 기본값(600초 타임아웃, 최대 2회
        # 재시도)을 그대로 두면 OpenAI가 응답이 느릴 때 "캐시로 폴백"하기까지
        # 너무 오래 걸려 사실상 폴백의 의미가 없어진다.
        client = OpenAI(
            api_key=self._api_key,
            timeout=self._request_timeout_seconds,
            max_retries=0,
        )
        text = _html_to_text(html)
        completion = client.chat.completions.create(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "너는 대학교 학식 페이지 텍스트에서 요일별 식단을 추출하는 도구다. "
                        "주어진 텍스트에서 이번 주 평일(월~금)의 아침/중식/석식 메뉴를 찾아 "
                        "지정된 JSON 스키마로만 응답해라. 해당하는 항목이 없으면 빈 배열로 남겨라."
                    ),
                },
                {"role": "user", "content": text[:40000]},
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

"""suggest_meeting()에 대한 단위 테스트.

이 프로젝트의 백엔드는 지금까지 자동화된 테스트가 전혀 없었다.
아래 테스트는 최소한의 안전망으로, 특히 두 번째 테스트는
프론트엔드 연동 작업 중 실제로 발견됐던 다음 버그의 재발을 막기 위한
회귀 테스트다.

    JS의 Date.prototype.toISOString()은 항상 타임존 정보가 붙은(aware)
    UTC 문자열("...T10:00:00.000Z")을 만드는데, 예전 _floor_to_slot()은
    항상 naive datetime을 기준으로 뺄셈을 해서 aware/naive를 섞어 빼면
    TypeError가 발생했다. _to_naive()로 정규화해서 고쳤다.
"""

from datetime import datetime

import pytest

from main import SuggestRequest, suggest_meeting


def _build_request(member_a_avail: dict, member_b_avail: dict, **overrides) -> SuggestRequest:
    payload = {
        "meeting_minutes": 60,
        "slot_minutes": 30,
        "top_k": 5,
        "members": [
            {"name": "홍길동", "avail": [member_a_avail]},
            {"name": "김철수", "avail": [member_b_avail]},
        ],
    }
    payload.update(overrides)
    return SuggestRequest(**payload)


def test_overlap_case_returns_best_candidate_first():
    """두 사람의 겹치는 시간이 올바르게 계산되고, 두 명 다 가능한 슬롯이 최상위로 온다."""
    req = _build_request(
        {"start": "2026-09-07T10:00:00", "end": "2026-09-07T12:00:00"},
        {"start": "2026-09-07T09:00:00", "end": "2026-09-07T11:00:00"},
    )

    result = suggest_meeting(req)

    assert len(result.candidates) > 0
    top = result.candidates[0]
    assert top.start == datetime(2026, 9, 7, 10, 0)
    assert top.end == datetime(2026, 9, 7, 11, 0)
    assert top.available_count == 2
    assert set(top.available_members) == {"홍길동", "김철수"}


def test_timezone_aware_input_does_not_crash_and_matches_naive_result():
    """회귀 테스트: timezone-aware(UTC 'Z' / '+00:00') 입력이 naive 입력과 동일한 결과를 내야 한다.

    수정 전에는 이 테스트가 TypeError로 죽었다
    (can't subtract offset-naive and offset-aware datetimes).
    """
    naive_req = _build_request(
        {"start": "2026-09-07T10:00:00", "end": "2026-09-07T12:00:00"},
        {"start": "2026-09-07T09:00:00", "end": "2026-09-07T11:00:00"},
    )
    z_suffix_req = _build_request(
        {"start": "2026-09-07T10:00:00.000Z", "end": "2026-09-07T12:00:00.000Z"},
        {"start": "2026-09-07T09:00:00.000Z", "end": "2026-09-07T11:00:00.000Z"},
    )
    offset_suffix_req = _build_request(
        {"start": "2026-09-07T10:00:00+00:00", "end": "2026-09-07T12:00:00+00:00"},
        {"start": "2026-09-07T09:00:00+00:00", "end": "2026-09-07T11:00:00+00:00"},
    )

    naive_result = suggest_meeting(naive_req)
    z_result = suggest_meeting(z_suffix_req)         # 수정 전이었다면 여기서 TypeError
    offset_result = suggest_meeting(offset_suffix_req)  # 수정 전이었다면 여기서도 TypeError

    assert len(z_result.candidates) == len(naive_result.candidates)
    assert len(offset_result.candidates) == len(naive_result.candidates)
    assert z_result.candidates[0].start == naive_result.candidates[0].start
    assert z_result.candidates[0].end == naive_result.candidates[0].end


def test_no_overlap_returns_empty_candidates():
    """아무도 60분(meeting_minutes) 연속 슬롯을 채울 수 없으면 빈 배열을 반환해야 한다.

    주의: suggest_meeting()은 "전원이 겹치는 시간"만 추천하는 게 아니라
    "가능한 인원이 1명 이상이기만 하면" 후보에 넣고 인원수로 정렬하는
    설계다(available_count 기반 랭킹). 따라서 단순히 두 사람의 시간대가
    겹치지 않는 것만으로는 빈 배열이 보장되지 않는다 - 실제로 처음 작성한
    테스트는 이 가정이 틀려서 실패했다. 진짜로 빈 배열이 나오는 조건은
    "어느 한 사람도 요청한 회의 길이(meeting_minutes)만큼 연속된 슬롯을
    갖고 있지 않은 경우"다. 그래서 각 팀원의 가용 시간을 meeting_minutes(60분)
    보다 짧은 30분으로만 줘서, 애초에 연속성 조건(needed_slots=2)을 아무도
    만족할 수 없게 만든다.
    """
    req = _build_request(
        {"start": "2026-09-07T09:00:00", "end": "2026-09-07T09:30:00"},
        {"start": "2026-09-07T11:00:00", "end": "2026-09-07T11:30:00"},
    )

    result = suggest_meeting(req)

    assert result.candidates == []


# ---------- /cafeteria/week 엔드포인트 배선(wiring) 테스트 ----------
# suggest_meeting과 달리 이 엔드포인트는 순수 함수가 아니라 모듈 전역
# _cafeteria_provider에 의존하므로, main 모듈을 직접 import해서 provider를
# MockCafeteriaMenuProvider로 바꿔치기한 뒤 엔드포인트 함수를 호출한다.
# (TestClient/httpx 의존성을 추가하지 않기 위해 FastAPI 라우팅 계층은 거치지 않고
# 엔드포인트 함수 자체를 직접 호출해 검증한다.)
import main as main_module
from cafeteria import CafeteriaExtractionError, CafeteriaMenu, CafeteriaMeals, MockCafeteriaMenuProvider
from fastapi import HTTPException


def test_cafeteria_week_returns_provider_data(monkeypatch):
    menus = [CafeteriaMenu(date="2026-09-07", meals=CafeteriaMeals(lunch=["김치찌개"]))]
    monkeypatch.setattr(main_module, "_cafeteria_provider", MockCafeteriaMenuProvider(menus))

    result = main_module.cafeteria_week()

    assert result == menus


def test_cafeteria_week_returns_502_when_provider_fails(monkeypatch):
    class FailingProvider:
        def get_week_menu(self):
            raise CafeteriaExtractionError("원본 페이지를 가져올 수 없습니다.")

    monkeypatch.setattr(main_module, "_cafeteria_provider", FailingProvider())

    with pytest.raises(HTTPException) as exc_info:
        main_module.cafeteria_week()

    assert exc_info.value.status_code == 502

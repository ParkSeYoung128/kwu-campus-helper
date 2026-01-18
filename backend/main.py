from __future__ import annotations

from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ---------- Request/Response Models ----------
class TimeRange(BaseModel):
    start: datetime
    end: datetime

    def validate_range(self) -> None:
        if self.end <= self.start:
            raise ValueError("end must be after start")


class MemberAvailability(BaseModel):
    name: str = Field(min_length=1)
    avail: List[TimeRange]


class SuggestRequest(BaseModel):
    timezone: str = "Asia/Seoul"
    meeting_minutes: int = Field(gt=0, le=24 * 60)
    slot_minutes: int = Field(gt=0, le=120)
    top_k: int = Field(gt=0, le=50)
    members: List[MemberAvailability] = Field(min_length=1)


class Candidate(BaseModel):
    start: datetime
    end: datetime
    available_members: List[str]
    available_count: int
    score: float


class SuggestResponse(BaseModel):
    candidates: List[Candidate]


# ---------- Core Logic ----------
def _floor_to_slot(dt: datetime, slot_minutes: int) -> datetime:
    slot = timedelta(minutes=slot_minutes)
    epoch = datetime(dt.year, dt.month, dt.day)  # day start
    delta = dt - epoch
    slots = int(delta.total_seconds() // slot.total_seconds())
    return epoch + slots * slot


def _ceil_to_slot(dt: datetime, slot_minutes: int) -> datetime:
    slot = timedelta(minutes=slot_minutes)
    f = _floor_to_slot(dt, slot_minutes)
    return f if f == dt else f + slot


def _expand_availability_to_slots(r: TimeRange, slot_minutes: int) -> List[datetime]:
    r.validate_range()
    start = _ceil_to_slot(r.start, slot_minutes)
    end = _floor_to_slot(r.end, slot_minutes)
    if end < start:
        return []
    slots = []
    cur = start
    step = timedelta(minutes=slot_minutes)
    while cur <= end - step:
        slots.append(cur)
        cur += step
    return slots


def suggest_meeting(req: SuggestRequest) -> SuggestResponse:
    # 1) 각 멤버별 "가능 슬롯 시작시간들"을 집합으로 만든다
    member_slot_sets: dict[str, set[datetime]] = {}

    for m in req.members:
        s: set[datetime] = set()
        for r in m.avail:
            for slot_start in _expand_availability_to_slots(r, req.slot_minutes):
                s.add(slot_start)
        member_slot_sets[m.name] = s

    # 2) 후보 시작시각들(전체 슬롯의 합집합)
    all_slots = sorted(set().union(*member_slot_sets.values())) if member_slot_sets else []
    if not all_slots:
        return SuggestResponse(candidates=[])

    # 3) 회의 길이(meeting_minutes)가 성립하려면 연속 슬롯 N개가 필요
    needed_slots = (req.meeting_minutes + req.slot_minutes - 1) // req.slot_minutes
    step = timedelta(minutes=req.slot_minutes)

    # 빠른 조회용
    all_slot_set = set(all_slots)

    candidates: list[Candidate] = []
    for start in all_slots:
        # 연속성 체크(필수)
        ok_continuous = True
        for k in range(needed_slots):
            if start + k * step not in all_slot_set:
                ok_continuous = False
                break
        if not ok_continuous:
            continue

        # 멤버별로 이 연속 슬롯들을 모두 포함하는지 검사
        available_members: list[str] = []
        for name, sset in member_slot_sets.items():
            if all((start + k * step) in sset for k in range(needed_slots)):
                available_members.append(name)

        if not available_members:
            continue

        end = start + needed_slots * step
        score = float(len(available_members))
        candidates.append(
            Candidate(
                start=start,
                end=end,
                available_members=available_members,
                available_count=len(available_members),
                score=score,
            )
        )

    # 4) 정렬: (가능 인원 desc) → (시작 시간 asc)
    candidates.sort(key=lambda c: (-c.available_count, c.start))

    # 5) top_k 반환
    return SuggestResponse(candidates=candidates[: req.top_k])


# ---------- FastAPI App ----------
app = FastAPI(title="Meeting Suggest API")

# CORS 설정 - React Native, Vite 개발서버 지원
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/meeting/suggest", response_model=SuggestResponse)
def api_suggest(req: SuggestRequest):
    try:
        return suggest_meeting(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

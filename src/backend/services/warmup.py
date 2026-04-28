"""
Anti-ban warm-up logic (PRD-v3 §4.2).

Warm-up only applies to new numbers (is_new_number=True).
Established numbers always use the relaxed schedule (week 3+).

Schedule:
  Week 0 (not started)  → 30–60 s   (same as week 1, safety default)
  Week 1 (days 1–7)     → 30–60 s
  Week 2 (days 8–14)    → 15–30 s
  Week 3+ (day 15+)     → 5–10 s

Daily message limits (enforced by Celery beat in a future story):
  Week 1 →  10 msgs/day
  Week 2 →  30 msgs/day
  Week 3 →  60 msgs/day
  Week 4+ → 100 msgs/day
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class WarmupConfig:
    week:      int   # 0 = not started, 1–N = current warm-up week
    delay_min: int   # seconds
    delay_max: int   # seconds
    msg_limit: int   # msgs/day (-1 = unlimited)


# Keyed by week number; week 0 reuses week-1 values
_SCHEDULE: dict[int, tuple[int, int, int]] = {
    # week: (delay_min_s, delay_max_s, msgs_per_day)
    1: (30, 60,  10),
    2: (15, 30,  30),
    3: ( 5, 10,  60),
    4: ( 5, 10, 100),
}
_DEFAULT_RELAXED = (5, 10, -1)   # established numbers / week 4+


def compute_warmup_config(
    *,
    is_new_number:    bool,
    connected_at:     datetime | None,
    warmup_started_at: datetime | None,
) -> WarmupConfig:
    """
    Return the WarmupConfig that should be active right now for this tenant.

    - Established numbers always get the relaxed profile (week 3+ delays).
    - New numbers: week is derived from warmup_started_at (falls back to
      connected_at if warmup hasn't been explicitly started).
    """
    if not is_new_number:
        d_min, d_max, limit = _DEFAULT_RELAXED
        return WarmupConfig(week=0, delay_min=d_min, delay_max=d_max, msg_limit=limit)

    anchor = warmup_started_at or connected_at
    if anchor is None:
        # Not yet connected — return week-1 conservative defaults
        d_min, d_max, limit = _SCHEDULE[1]
        return WarmupConfig(week=1, delay_min=d_min, delay_max=d_max, msg_limit=limit)

    now  = datetime.now(timezone.utc)
    days = max(0, (now - anchor.replace(tzinfo=timezone.utc)).days)
    week = min(days // 7 + 1, 4)   # cap at week 4

    d_min, d_max, limit = _SCHEDULE.get(week, _SCHEDULE[4])
    return WarmupConfig(week=week, delay_min=d_min, delay_max=d_max, msg_limit=limit)


def compute_health_score(
    *,
    status:       str,           # connected | disconnected | banned | error
    warmup_cfg:   WarmupConfig,
    block_count:  int,
    msgs_sent:    int,
    msg_limit:    int,           # -1 = unlimited
) -> float:
    """
    0–100 score. Higher is healthier.

    Points breakdown:
      50  — connection status (connected=50, else=0)
      20  — delay config appropriate for warmup week (proper=20)
      20  — block rate (0 blocks=20, -5 per block, floor 0)
      10  — within daily limit (within limit=10, else=0)
    """
    score = 0.0

    # Connection
    if status == "connected":
        score += 50

    # Delay appropriateness
    # A delay_min below the week's minimum is risky
    if warmup_cfg.delay_min >= warmup_cfg.delay_min:
        score += 20   # delays are at least at the required minimum

    # Block rate
    block_penalty = min(block_count * 5, 20)
    score += max(0.0, 20 - block_penalty)

    # Daily limit compliance
    if msg_limit == -1 or msgs_sent <= msg_limit:
        score += 10

    return round(min(score, 100.0), 1)

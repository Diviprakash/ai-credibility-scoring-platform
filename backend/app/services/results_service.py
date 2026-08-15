import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from app.models.event import EventOption
from app.models.vote import Vote


def calculate_event_results(
    event_id: uuid.UUID,
    event_title: str,
    status_val: str,
    options: List[EventOption],
    votes: List[Vote],
) -> Dict[str, Any]:
    """Pure deterministic calculation engine for raw and credibility-weighted election results.

    Operates strictly on stored votes and immutable votes.credibility_at_vote snapshots.
    """
    total_votes = len(votes)

    # Initialize per-option tally
    opt_counts: Dict[uuid.UUID, int] = {opt.id: 0 for opt in options}
    opt_weights: Dict[uuid.UUID, float] = {opt.id: 0.0 for opt in options}
    opt_text_map: Dict[uuid.UUID, str] = {opt.id: opt.option_text for opt in options}

    for v in votes:
        if v.selected_option_id in opt_counts:
            opt_counts[v.selected_option_id] += 1
            opt_weights[v.selected_option_id] += float(v.credibility_at_vote)

    total_weight = round(sum(opt_weights.values()), 4)

    # Calculate Raw Results
    raw_results = []
    for opt in options:
        count = opt_counts[opt.id]
        if total_votes > 0:
            percentage = round((Decimal(count) / Decimal(total_votes)) * Decimal(100), 4)
        else:
            percentage = Decimal("0.0000")

        raw_results.append(
            {
                "option_id": str(opt.id),
                "option_text": opt_text_map[opt.id],
                "count": count,
                "percentage": float(percentage),
            }
        )

    # Calculate Weighted Results
    weighted_results = []
    for opt in options:
        w_sum = round(opt_weights[opt.id], 4)
        if total_weight > 0:
            percentage = round((Decimal(str(w_sum)) / Decimal(str(total_weight))) * Decimal(100), 4)
        else:
            percentage = Decimal("0.0000")

        weighted_results.append(
            {
                "option_id": str(opt.id),
                "option_text": opt_text_map[opt.id],
                "weighted_sum": w_sum,
                "percentage": float(percentage),
            }
        )

    # Determine Raw Winner
    raw_winner: Optional[Dict[str, str]] = None
    if total_votes > 0:
        max_count = max(opt_counts.values())
        top_raw = [opt_id for opt_id, cnt in opt_counts.items() if cnt == max_count]
        if len(top_raw) == 1:
            raw_winner = {
                "option_id": str(top_raw[0]),
                "option_text": opt_text_map[top_raw[0]],
            }

    # Determine Weighted Winner and Decision Status
    winning_option: Optional[Dict[str, str]] = None
    decision_status: str

    if total_votes == 0:
        decision_status = "NO_VOTES"
    elif total_weight == 0:
        decision_status = "NO_WEIGHT"
    else:
        max_weight = max(opt_weights.values())
        top_weighted = [opt_id for opt_id, wt in opt_weights.items() if wt == max_weight]
        if len(top_weighted) == 1:
            winning_option = {
                "option_id": str(top_weighted[0]),
                "option_text": opt_text_map[top_weighted[0]],
            }
            decision_status = "DECIDED"
        else:
            decision_status = "TIE"

    return {
        "event_id": str(event_id),
        "event_title": event_title,
        "status": status_val,
        "total_votes": total_votes,
        "total_weight": total_weight,
        "raw_results": raw_results,
        "weighted_results": weighted_results,
        "raw_winner": raw_winner,
        "winning_option": winning_option,
        "decision_status": decision_status,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
    }

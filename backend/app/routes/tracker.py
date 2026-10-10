
from fastapi import APIRouter
from app.schemas.tracker import TrackerCategory, TrackerInfo
from app.services.tracker_service import (
    find_tracker,
    normalize_domain,
)

router = APIRouter(
    prefix="/api/trackers",
    tags=["Trackers"],
)

@router.get("/{domain}", response_model=TrackerInfo)
def get_tracker(domain: str):
    normalized = normalize_domain(domain)
    match = find_tracker(normalized)

    if match:
        return TrackerInfo(
            domain=normalized,
            category=TrackerCategory(match["category"]),
            request_count=0,
            known_tracker=True,
            description=match.get("description"),
        )

    return TrackerInfo(
        domain=normalized,
        category=TrackerCategory.OTHER,
        request_count=0,
        known_tracker=False,
    )

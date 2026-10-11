from collections import Counter
from fastapi import APIRouter
from app.schemas.scan import ScanRequest, ScanResponse
from app.services.tracker_service import classify_requests

router = APIRouter(
    prefix="/api/scans",
    tags=["Scans"],
)

@router.post("/analyze", response_model=ScanResponse)
def analyze_scan(scan: ScanRequest):
    trackers = classify_requests(scan.requests)

    known_trackers = [
        tracker for tracker in trackers
        if tracker.known_tracker
    ]

    category_counts = dict(
        Counter(
            tracker.category.value
            for tracker in known_trackers
        )
    )

    return ScanResponse(
        website=scan.website,
        tracker_count=len({
            tracker.domain for tracker in known_trackers
        }),
        third_party_requests=sum(
            request.request_count for request in scan.requests
        ),
        cookie_count=scan.cookies.total,
        permission_count=scan.permission_count,
        trackers=trackers,
        category_counts=category_counts,
        cookie_analysis=scan.cookies.analysis,
        permissions=scan.permissions,
    )

import json
from functools import lru_cache
from pathlib import Path
from app.schemas.scan import NetworkRequest
from app.schemas.tracker import TrackerCategory, TrackerInfo


TRACKER_DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "tracker_domains.json"
)

@lru_cache(maxsize=1)
def load_tracker_database() -> dict:
    with TRACKER_DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)

def normalize_domain(domain: str) -> str:
    return domain.strip().lower().rstrip(".")

def find_tracker(domain: str) -> dict | None:
    database = load_tracker_database()
    normalized = normalize_domain(domain)

    # Match exact domains and their subdomains.
    for known_domain, details in database.items():
        if (
            normalized == known_domain
            or normalized.endswith("." + known_domain)
        ):
            return details

    return None

def classify_requests(
    requests: list[NetworkRequest],
) -> list[TrackerInfo]:
    trackers = []

    for request in requests:
        domain = normalize_domain(request.domain)
        match = find_tracker(domain)
        if match:
            trackers.append(
                TrackerInfo(
                    domain=domain,
                    category=TrackerCategory(match["category"]),
                    request_count=request.request_count,
                    known_tracker=True,
                    description=match.get("description"),
                )
            )
        else:
            trackers.append(
                TrackerInfo(
                    domain=domain,
                    category=TrackerCategory.OTHER,
                    request_count=request.request_count,
                    known_tracker=False,
                )
            )
    return trackers

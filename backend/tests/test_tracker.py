from app.schemas.scan import NetworkRequest
from app.services.tracker_service import (
    classify_requests,
    find_tracker,
    normalize_domain,
)

def test_normalize_domain():
    assert normalize_domain(" DOUBLECLICK.NET. ") == "doubleclick.net"

def test_known_tracker():
    assert find_tracker("stats.doubleclick.net") is not None

def test_unknown_tracker():
    assert find_tracker("cdn.example.org") is None

def test_classify_requests():
    requests = [
        NetworkRequest(domain="doubleclick.net", request_count=5),
        NetworkRequest(domain="cdn.example.org", request_count=2),
    ]

    result = classify_requests(requests)

    assert len(result) == 2
    assert result[0].known_tracker is True
    assert result[0].category.value == "advertising"
    assert result[1].known_tracker is False
    assert result[1].category.value == "other"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_scan():
    response = client.post(
        "/api/scans/analyze",
        json={
            "website": "example.com",
            "requests": [
                {
                    "domain": "doubleclick.net",
                    "request_count": 5,
                },
                {
                    "domain": "cdn.example.org",
                    "request_count": 2,
                },
            ],
            "cookies": {
                "total": 10,
                "third_party": 3,
            },
            "permission_count": 1,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["website"] == "example.com"
    assert data["tracker_count"] == 1
    assert data["third_party_requests"] == 7
    assert data["cookie_count"] == 10
    assert data["permission_count"] == 1
    assert data["category_counts"]["advertising"] == 1
    assert len(data["trackers"]) == 2

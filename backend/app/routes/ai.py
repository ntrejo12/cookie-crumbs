from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse, ScanAnalysisRequest, ObservedDomain
from app.services import ai_service, preferences_service, classifier

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze(body: AIAnalysisRequest,
            user_id: str = Depends(get_current_user_id),
            db: Session = Depends(get_db)):
    prefs = preferences_service.get_or_create(db, user_id)
    if not prefs.enable_ai_analysis:
        raise HTTPException(403, "AI analysis is turned off in your preferences.")
    return ai_service.analyze(body)

@router.post("/analyze-scan", response_model=AIAnalysisResponse)
def analyze_scan(body: ScanAnalysisRequest,
                 user_id: str = Depends(get_current_user_id),
                 db: Session = Depends(get_db)):
    prefs = preferences_service.get_or_create(db, user_id)
    if not prefs.enable_ai_analysis:
        raise HTTPException(status_code=403,
                            detail="AI analysis is turned off in your preferences.")

    trackers = classifier.classify_aggregated(body.domains)
    req = AIAnalysisRequest(
        website=body.website,
        cookie_count=body.cookie_count,
        third_party_request_count=sum(d.request_count for d in body.domains if d.is_third_party),
        permissions=body.permissions,
        trackers=trackers,
    )
    return ai_service.analyze(req)
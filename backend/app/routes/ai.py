# routes/ai.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db                     
from app.dependencies import get_current_user_id
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse
from app.services import ai_service, preferences_service

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze(body: AIAnalysisRequest,
            user_id: str = Depends(get_current_user_id),
            db: Session = Depends(get_db)):
    prefs = preferences_service.get_or_create(db, user_id)
    if not prefs.enable_ai_analysis:
        raise HTTPException(403, "AI analysis is turned off in your preferences.")
    return ai_service.analyze(body)
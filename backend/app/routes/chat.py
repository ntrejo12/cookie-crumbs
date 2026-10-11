from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service, preferences_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest,
         user_id: str = Depends(get_current_user_id),
         db: Session = Depends(get_db)):
    prefs = preferences_service.get_or_create(db, user_id)
    if not prefs.enable_ai_analysis:
        raise HTTPException(status_code=403,
                            detail="AI features are turned off in your preferences.")
    if chat_service.rate_limited(user_id):
        raise HTTPException(status_code=429,
                            detail="You're sending messages quickly. Please wait a moment.")
    return chat_service.reply(db, user_id, body)
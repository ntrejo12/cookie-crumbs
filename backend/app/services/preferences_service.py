from sqlalchemy.orm import Session
from app.db.models import UserPreference
from app.schemas.preference import UserPreferenceUpdate

def get_or_create(db: Session, user_id: str) -> UserPreference:
    pref = db.query(UserPreference).filter_by(user_id=user_id).first()
    if pref is None:
        pref = UserPreference(
            user_id=user_id,
            save_scan_history=False,
            enable_ai_analysis=True,
            allow_optional_tracking=False,
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

def update(db: Session, user_id: str, body: UserPreferenceUpdate) -> UserPreference:
    pref = get_or_create(db, user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(pref, field, value)
    db.commit()
    db.refresh(pref)
    return pref
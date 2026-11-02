from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models import User
from app.schemas import UserLogin, UserCreate, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)

@router.post("/login", response_model=Token)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)

@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """
    Seamless demonstration login providing full access for evaluation without registration friction.
    """
    demo_email = "captain@naviqgreen.maritime"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            hashed_password=get_password_hash("NaviQGreen2026!"),
            full_name="Fleet Operations Commander",
            role="fleet_manager"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=user)


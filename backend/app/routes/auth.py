from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.service import register_organization_owner, authenticate_user
from app.database import get_db
from app.models import Organization, User
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_org = db.query(Organization).filter(
        Organization.slug == payload.organization_slug
    ).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization slug already exists")

    user = register_organization_owner(
        db=db,
        organization_name=payload.organization_name,
        organization_slug=payload.organization_slug,
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
    )
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(subject=user.email)
    return TokenResponse(access_token=token)
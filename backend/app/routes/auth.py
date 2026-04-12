from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.service import authenticate_user, register_organization_owner
from app.database import get_db
from app.models import Organization, User
from app.schemas import ApiMessage, TokenResponse, UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_db(db: Session):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )


# ============================================
# CORS PREFLIGHT HANDLER
# ============================================
@router.options("/{path:path}")
async def preflight_handler() -> Response:
    return Response(status_code=200)


# ============================================
# REGISTER ENDPOINT
# Creates an organization + owner account
# ============================================
@router.post(
    "/register",
    response_model=ApiMessage,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    _ensure_db(db)

    try:
        email = payload.email.strip().lower()
        organization_slug = payload.organization_slug.strip().lower()
        organization_name = payload.organization_name.strip()
        full_name = payload.full_name.strip()

        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        existing_org = (
            db.query(Organization)
            .filter(Organization.slug == organization_slug)
            .first()
        )
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization slug already exists",
            )

        register_organization_owner(
            db=db,
            organization_name=organization_name,
            organization_slug=organization_slug,
            full_name=full_name,
            email=email,
            password=payload.password,
        )

        return ApiMessage(message="Registration successful. You can now sign in.")

    except HTTPException:
        raise

    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during registration",
        )

    except Exception as e:
        db.rollback()
        print(f"Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed unexpectedly",
        )


# ============================================
# LOGIN ENDPOINT
# ============================================
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    _ensure_db(db)

    try:
        email = payload.email.strip().lower()
        user = authenticate_user(db, email, payload.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if hasattr(user, "is_active") and user.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        token = create_access_token(subject=user.email)
        return TokenResponse(access_token=token)

    except HTTPException:
        raise

    except SQLAlchemyError as e:
        print(f"Database error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during login",
        )

    except Exception as e:
        print(f"Unexpected error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed unexpectedly",
        )
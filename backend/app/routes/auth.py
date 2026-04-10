from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.service import authenticate_user, register_organization_owner
from app.database import get_db
from app.models import Organization, User
from app.schemas import ApiMessage, TokenResponse, UserLogin, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================
# CORS PREFLIGHT HANDLER (Fixes 405 on OPTIONS)
# ============================================
@router.options("/{path:path}")
async def preflight_handler() -> Response:
    """Handle CORS preflight requests for all auth endpoints."""
    return Response(status_code=200)


# ============================================
# REGISTER ENDPOINT
# ============================================
@router.post(
    "/register",
    response_model=ApiMessage,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        existing_user = db.query(User).filter(User.email == payload.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        existing_org = (
            db.query(Organization)
            .filter(Organization.slug == payload.organization_slug)
            .first()
        )
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization slug already exists",
            )

        register_organization_owner(
            db=db,
            organization_name=payload.organization_name,
            organization_slug=payload.organization_slug,
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
        )

        return ApiMessage(message="Registration successful")

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
            detail=f"Registration failed unexpectedly: {str(e)}",
        )


# ============================================
# LOGIN ENDPOINT
# ============================================
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        user = authenticate_user(db, payload.email, payload.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
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
            detail=f"Login failed unexpectedly: {str(e)}",
        )
from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.models import User
from app.schemas import OrganizationOut

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("/me", response_model=OrganizationOut)
def get_my_organization(current_user: User = Depends(get_current_user)):
    return current_user.organization
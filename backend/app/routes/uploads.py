from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from datetime import datetime

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import ApiMessage

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Configure upload directory (use Railway volume or local for testing)
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    "document": [".pdf", ".doc", ".docx", ".txt", ".md", ".csv"],
}

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    category: str = "document",
    current_user: User = Depends(get_current_user),
):
    """Upload a file (image or document) for the user's workspace."""
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    allowed = ALLOWED_EXTENSIONS.get(category, [])
    if allowed and ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type not allowed for category '{category}'. Allowed: {allowed}")
    
    # Generate unique filename
    unique_id = uuid.uuid4().hex
    safe_name = f"{current_user.organization_id}_{current_user.id}_{unique_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Store file metadata in database (optional)
    # For now, just return the file URL
    file_url = f"/uploads/{safe_name}"
    
    return {
        "filename": file.filename,
        "saved_name": safe_name,
        "url": file_url,
        "size": os.path.getsize(file_path),
        "category": category,
        "uploaded_at": datetime.utcnow().isoformat(),
    }

@router.get("/{file_name}")
async def get_file(file_name: str, current_user: User = Depends(get_current_user)):
    """Download a file (authorization required)."""
    file_path = os.path.join(UPLOAD_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    from fastapi.responses import FileResponse
    return FileResponse(file_path)
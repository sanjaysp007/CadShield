import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database.db import get_db
from database.models import User
from models.schemas import (
    SignupRequest, LoginRequest, AuthResponse,
    UserInfo, ProfileUpdateRequest,
)
from utils.auth import (
    hash_password, verify_password, generate_owner_id,
    create_access_token, get_current_user,
)

router = APIRouter(prefix='/api/auth', tags=['auth'])

PROFILE_PHOTOS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "profile_photos")
os.makedirs(PROFILE_PHOTOS_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB


def _user_to_info(user: User) -> UserInfo:
    return UserInfo(
        id=user.id,
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        college_company=user.college_company,
        department=user.department,
        designation=user.designation,
        location=user.location,
        bio=user.bio,
        profile_photo=user.profile_photo,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ── Sign Up ───────────────────────────────────────────
@router.post('/signup', response_model=AuthResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="An account with this email already exists")

    user_id = generate_owner_id()
    while db.query(User).filter(User.user_id == user_id).first():
        user_id = generate_owner_id()

    user = User(
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
        full_name=req.full_name.strip(),
        user_id=user_id,
        college_company=req.organization.strip() if req.organization else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(token=token, user=_user_to_info(user))


# ── Login ─────────────────────────────────────────────
@router.post('/login', response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")
    token = create_access_token(user.id, user.email)
    return AuthResponse(token=token, user=_user_to_info(user))


# ── Get Current User ──────────────────────────────────
@router.get('/me', response_model=UserInfo)
def me(user: User = Depends(get_current_user)):
    return _user_to_info(user)


# ── Update Profile ────────────────────────────────────
@router.put('/profile', response_model=UserInfo)
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update editable profile fields. email and user_id cannot be changed."""
    if req.full_name is not None:
        name = req.full_name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Full name must be at least 2 characters")
        user.full_name = name

    if req.phone is not None:
        phone = req.phone.strip()
        if phone and len(phone) > 20:
            raise HTTPException(status_code=400, detail="Phone number too long")
        user.phone = phone or None

    if req.college_company is not None:
        user.college_company = req.college_company.strip() or None
    if req.department is not None:
        user.department = req.department.strip() or None
    if req.designation is not None:
        user.designation = req.designation.strip() or None
    if req.location is not None:
        user.location = req.location.strip() or None
    if req.bio is not None:
        bio = req.bio.strip()
        if len(bio) > 500:
            raise HTTPException(status_code=400, detail="Bio must be under 500 characters")
        user.bio = bio or None
    if req.profile_photo is not None:
        user.profile_photo = req.profile_photo  # base64 data-url

    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return _user_to_info(user)


# ── Upload Profile Photo ──────────────────────────────
@router.post('/profile/photo', response_model=UserInfo)
async def upload_profile_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400,
                            detail="Only JPEG, PNG, WebP or GIF images are allowed")

    content = await file.read()
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=400, detail="Profile photo must be under 5 MB")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(PROFILE_PHOTOS_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    # Store as relative URL served by /profile_photos static mount
    user.profile_photo = f"/profile_photos/{filename}"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return _user_to_info(user)

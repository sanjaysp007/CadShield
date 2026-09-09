import uuid, os, json, string, random
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database.db import get_db
from database.models import CADModel, VerificationRecord, User
from models.schemas import (
    ModelUploadResponse, ModelListItem, DashboardStats,
    ProjectVerificationResponse, PublicCreatorProfile,
)
from utils.file_utils import validate_file, get_safe_filename, get_upload_path
from services.watermark import get_mesh_info
from utils.crypto import generate_model_hash
from utils.auth import get_current_user, get_optional_user

router = APIRouter(prefix='/api/models', tags=['models'])


def _generate_project_id() -> str:
    chars = string.ascii_uppercase + string.digits
    s1 = ''.join(random.choices(chars, k=4))
    s2 = ''.join(random.choices(chars, k=4))
    return f"PRJ-{s1}-{s2}"


# ── Upload Model ──────────────────────────────────────
@router.post('/upload', response_model=ModelUploadResponse)
async def upload_model(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    content = await file.read()
    valid, msg = validate_file(file.filename, len(content))
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    filename   = get_safe_filename(file.filename)
    model_uuid = str(uuid.uuid4())
    path       = get_upload_path(f"{model_uuid}_{filename}")

    with open(path, "wb") as f:
        f.write(content)

    mesh_info      = get_mesh_info(path)
    original_hash  = generate_model_hash(content)
    file_ext       = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'stl'

    # Generate unique project_id
    project_id = _generate_project_id()
    while db.query(CADModel).filter(CADModel.project_id == project_id).first():
        project_id = _generate_project_id()

    db_model = CADModel(
        id=model_uuid,
        project_id=project_id,
        project_name=os.path.splitext(filename)[0].replace('_', ' ').title(),
        name=filename,
        original_filename=file.filename,
        file_format=file_ext,
        original_file_path=path,
        original_hash=original_hash,
        vertex_count=mesh_info.get('vertex_count', 0),
        face_count=mesh_info.get('face_count', 0),
        status='uploaded',
        # Attach creator identity if user is logged in
        user_db_id=current_user.id if current_user else None,
        creator_user_id=current_user.user_id if current_user else None,
        creator_name=current_user.full_name if current_user else None,
        creator_email=current_user.email if current_user else None,
        creator_college=current_user.college_company if current_user else None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)

    return ModelUploadResponse(
        id=db_model.id,
        filename=filename,
        status='uploaded',
        message='Model uploaded successfully',
        vertex_count=db_model.vertex_count,
        face_count=db_model.face_count,
        file_format=file_ext,
        mesh_info=mesh_info,
    )


# ── List All Models (global) ──────────────────────────
@router.get('/', response_model=list[ModelListItem])
def list_models(db: Session = Depends(get_db)):
    return db.query(CADModel).order_by(CADModel.created_at.desc()).all()


# ── My Projects (authenticated user only) ─────────────
@router.get('/my-projects', response_model=list[ModelListItem])
def my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CADModel)
        .filter(CADModel.creator_user_id == current_user.user_id)
        .order_by(CADModel.created_at.desc())
        .all()
    )


# ── Dashboard Stats ───────────────────────────────────
@router.get('/dashboard/stats', response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total          = db.query(CADModel).count()
    watermarked    = db.query(CADModel).filter(CADModel.status.in_(['watermarked','verified'])).count()
    verified_count = db.query(CADModel).filter(CADModel.status == 'verified').count()
    tampered_count = db.query(VerificationRecord).filter(VerificationRecord.is_tampered == True).count()
    all_scores     = db.query(CADModel.integrity_score).filter(
        CADModel.integrity_score != None, CADModel.integrity_score > 0).all()
    avg_integrity  = (sum(s[0] for s in all_scores) / len(all_scores)) if all_scores else 100.0
    verification_rate = (verified_count / total * 100) if total > 0 else 0.0
    return DashboardStats(
        total_models=total, watermarks_embedded=watermarked,
        verified=verified_count, tampered=tampered_count,
        avg_integrity=round(avg_integrity, 2),
        verification_rate=round(verification_rate, 2),
    )


# ── Analytics ─────────────────────────────────────────
@router.get('/analytics/{model_id}')
def get_analytics(model_id: str, db: Session = Depends(get_db)):
    from services.analytics import compute_analytics
    m = db.query(CADModel).filter(CADModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return compute_analytics(model_path=m.original_file_path,
                              watermarked_path=m.watermarked_file_path, db_record=m)


# ── Public Project Verification by Project ID ─────────
@router.get('/project-verify/{project_id}', response_model=ProjectVerificationResponse)
def project_verify(project_id: str, db: Session = Depends(get_db)):
    m = db.query(CADModel).filter(CADModel.project_id == project_id.strip().upper()).first()
    if not m or m.status == 'uploaded':
        return ProjectVerificationResponse(
            is_verified=False,
            message="Project not found or invalid Project ID.",
        )
    # Fetch creator profile photo if user exists
    creator = None
    if m.user_db_id:
        creator = db.query(User).filter(User.id == m.user_db_id).first()

    return ProjectVerificationResponse(
        is_verified=True,
        message="✓ Verified Project — watermark authenticated.",
        project_id=m.project_id,
        project_name=m.project_name or m.name,
        creator_name=m.creator_name,
        creator_user_id=m.creator_user_id,
        creator_email=None,         # do not expose email publicly
        creator_college=m.creator_college,
        profile_photo=creator.profile_photo if creator else None,
        created_at=m.created_at,
        status=m.status,
        integrity_score=m.integrity_score,
    )


# ── Public Creator Profile by User ID ─────────────────
@router.get('/creator/{user_id}')
def get_creator_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == user_id.strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Creator not found")

    projects = (
        db.query(CADModel)
        .filter(CADModel.creator_user_id == user.user_id,
                CADModel.status.in_(['watermarked', 'verified']))
        .order_by(CADModel.created_at.desc())
        .all()
    )

    return {
        "creator": {
            "user_id":        user.user_id,
            "full_name":      user.full_name,
            "college_company":user.college_company,
            "department":     user.department,
            "designation":    user.designation,
            "location":       user.location,
            "bio":            user.bio,
            "profile_photo":  user.profile_photo,
            "created_at":     user.created_at.isoformat() if user.created_at else None,
        },
        "projects": [
            {
                "project_id":   p.project_id,
                "project_name": p.project_name or p.name,
                "status":       p.status,
                "integrity_score": p.integrity_score,
                "created_at":   p.created_at.isoformat() if p.created_at else None,
            }
            for p in projects
        ],
    }


# ── Download Watermarked Model ────────────────────────
@router.get('/download/{model_id}')
def download_watermarked_model(model_id: str, db: Session = Depends(get_db)):
    m = db.query(CADModel).filter(CADModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if not m.watermarked_file_path:
        raise HTTPException(status_code=400, detail="Model not yet watermarked")
    if not os.path.exists(m.watermarked_file_path):
        raise HTTPException(status_code=404, detail="Watermarked file not on disk")

    base   = os.path.splitext(m.original_filename or m.name)[0]
    ext    = os.path.splitext(m.watermarked_file_path)[1] or '.stl'
    dlname = f"cadshield_{m.project_id or 'protected'}_{base}{ext}"
    return FileResponse(
        path=m.watermarked_file_path,
        media_type="application/octet-stream",
        filename=dlname,
        headers={"Content-Disposition": f'attachment; filename="{dlname}"'},
    )


# ── Get Single Model ──────────────────────────────────
@router.get('/{model_id}')
def get_model(model_id: str, db: Session = Depends(get_db)):
    m = db.query(CADModel).filter(CADModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "id": m.id, "project_id": m.project_id,
        "project_name": m.project_name, "name": m.name,
        "original_filename": m.original_filename,
        "file_format": m.file_format,
        "creator_user_id": m.creator_user_id,
        "creator_name": m.creator_name,
        "creator_college": m.creator_college,
        "owner_id": m.owner_id, "designer_name": m.designer_name,
        "model_id_str": m.model_id_str, "copyright_info": m.copyright_info,
        "status": m.status, "integrity_score": m.integrity_score,
        "distortion_percentage": m.distortion_percentage,
        "vertex_count": m.vertex_count, "face_count": m.face_count,
        "processing_time": m.processing_time,
        "watermark_metadata": json.loads(m.watermark_metadata) if m.watermark_metadata else None,
        "download_url": f"/api/models/download/{m.id}" if m.watermarked_file_path else None,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


# ── Delete Model ──────────────────────────────────────
@router.delete('/{model_id}')
def delete_model(model_id: str, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    m = db.query(CADModel).filter(CADModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if m.creator_user_id and m.creator_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own projects")
    for path in [m.original_file_path, m.watermarked_file_path]:
        if path and os.path.exists(path):
            try: os.remove(path)
            except: pass
    db.delete(m)
    db.commit()
    return {"message": "Project deleted successfully"}

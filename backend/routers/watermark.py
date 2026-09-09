import json, uuid, os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import CADModel, User
from models.schemas import WatermarkRequest, WatermarkResponse
from services.watermark import embed_watermark
from utils.file_utils import get_processed_path, validate_file, get_safe_filename, get_upload_path, cleanup_temp_file
from utils.crypto import hash_secret_key
from utils.auth import get_optional_user

router = APIRouter(prefix='/api/watermark', tags=['watermark'])


@router.post('/embed', response_model=WatermarkResponse)
def embed(
    req: WatermarkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    model = db.query(CADModel).filter(CADModel.id == req.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if not model.original_file_path or not os.path.exists(model.original_file_path):
        raise HTTPException(status_code=400, detail="Original model file not found on disk")

    # Build output path
    base_name = os.path.splitext(model.name)[0]
    ext = os.path.splitext(model.name)[1] or '.stl'
    out_filename = f"wm_{base_name}{ext}"
    out_path = get_processed_path(out_filename)

    # ── Enforce Creator Identification from Logged-in User ──
    # If user is authenticated, force creator info from their verified account.
    # Users cannot spoof another person's identity.
    if current_user:
        creator_name = current_user.full_name
        creator_user_id = current_user.user_id
        creator_email = current_user.email
        creator_college = current_user.college_company or ""
        user_db_id = current_user.id
    else:
        creator_name = req.designer_name or model.creator_name or "CADShield User"
        creator_user_id = req.owner_id or model.creator_user_id or "OWN-DEMO-0001"
        creator_email = model.creator_email or "demo@cadshield.com"
        creator_college = model.creator_college or ""
        user_db_id = model.user_db_id

    # Format official creator string according to specification
    creator_signature_text = f"Created by: {creator_name} | User ID: {creator_user_id}"
    if creator_college:
        creator_signature_text += f" | {creator_college}"

    project_name = req.project_name or model.project_name or os.path.splitext(model.original_filename or model.name)[0].replace('_', ' ').title()

    ownership = {
        'owner_id': creator_user_id,
        'designer_name': creator_name,
        'model_id': model.project_id or req.model_id_str or req.model_id,
        'copyright_info': req.copyright_info or f"© {datetime.now(timezone.utc).year} {creator_name}. All rights reserved.",
        'creator_text': creator_signature_text,
        'creator_college': creator_college,
        'project_name': project_name,
    }

    result = embed_watermark(
        model_path=model.original_file_path,
        output_path=out_path,
        ownership=ownership,
        secret_key=req.secret_key,
    )

    # Attach creator & project metadata to CADModel
    model.user_db_id = user_db_id
    model.creator_user_id = creator_user_id
    model.creator_name = creator_name
    model.creator_email = creator_email
    model.creator_college = creator_college or None
    model.project_name = project_name
    model.watermarked_filename = out_filename

    # Legacy fields
    model.owner_id = creator_user_id
    model.designer_name = creator_name
    model.model_id_str = model.project_id
    model.copyright_info = ownership['copyright_info']
    model.secret_key_hash = hash_secret_key(req.secret_key) if req.secret_key else None
    model.watermarked_file_path = out_path
    model.watermark_hash = result['signature']
    model.watermark_metadata = json.dumps({
        **result,
        "creator_text": creator_signature_text,
        "creator_name": creator_name,
        "creator_user_id": creator_user_id,
        "creator_college": creator_college,
    })
    model.status = 'watermarked'
    model.integrity_score = result['integrity_score']
    model.distortion_percentage = result['distortion_percentage']
    model.processing_time = result['processing_time']
    model.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(model)

    return WatermarkResponse(
        watermark_id=result['watermark_id'],
        project_id=model.project_id,
        integrity_score=result['integrity_score'],
        distortion_pct=result['distortion_percentage'],
        processing_time=result['processing_time'],
        download_url=f"/api/models/download/{model.id}",
        vertex_count=result['vertex_count'],
        face_count=result['face_count'],
        watermarked_vertices=result.get('watermarked_vertices'),
        timestamp=result.get('timestamp'),
        creator_name=creator_name,
        creator_user_id=creator_user_id,
    )


@router.post('/extract')
async def extract(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    valid, msg = validate_file(file.filename, len(content))
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    filename = get_safe_filename(file.filename)
    path = get_upload_path(f"extract_{uuid.uuid4()}_{filename}")
    with open(path, "wb") as f:
        f.write(content)

    try:
        from services.verification import verify_unknown_model
        models = db.query(CADModel).filter(CADModel.watermark_metadata != None).all()
        result = verify_unknown_model(path, models)
    finally:
        cleanup_temp_file(path)

    return result

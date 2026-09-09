from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database.db import get_db
from database.models import CADModel, VerificationRecord
from models.schemas import VerificationResponse, TamperRequest, TamperResponse
from services.verification import verify_model, verify_unknown_model
from services.tamper import simulate_tampering
from utils.file_utils import validate_file, get_safe_filename, get_upload_path, cleanup_temp_file
import uuid, os, json
from datetime import datetime, timezone

router = APIRouter(tags=['verification'])


@router.post('/api/models/verify', response_model=VerificationResponse)
async def verify(
    file: UploadFile = File(...),
    model_id: str = Form(None),
    db: Session = Depends(get_db)
):
    content = await file.read()
    valid, msg = validate_file(file.filename, len(content))
    if not valid:
        raise HTTPException(status_code=400, detail=msg)

    filename = get_safe_filename(file.filename)
    path = get_upload_path(f"verify_{uuid.uuid4()}_{filename}")
    with open(path, "wb") as f:
        f.write(content)

    try:
        if model_id:
            model = db.query(CADModel).filter(CADModel.id == model_id).first()
            if not model:
                raise HTTPException(status_code=404, detail="Model not found")
            res = verify_model(path, model)
            model.status = 'verified'
            db.commit()
        else:
            models = db.query(CADModel).filter(CADModel.watermark_metadata != None).all()
            res = verify_unknown_model(path, models)
    finally:
        cleanup_temp_file(path)

    # Record verification history
    rec = VerificationRecord(
        id=str(uuid.uuid4()),
        model_db_id=model_id,
        verified_filename=filename,
        is_authenticated=res.get('is_authenticated', False),
        is_tampered=res.get('is_tampered', False),
        owner_id_found=res.get('owner_id_found'),
        designer_found=res.get('designer_found'),
        model_id_found=res.get('model_id_found'),
        watermark_timestamp=res.get('watermark_timestamp'),
        integrity_score=res.get('integrity_score', 0.0),
        tampering_percentage=res.get('tampering_percentage', 0.0),
        confidence_score=res.get('confidence_score', 0.0),
        vertex_changes=res.get('vertex_changes', 0),
        face_changes=res.get('face_changes', 0),
        details=json.dumps(res.get('details', '')),
        verified_at=datetime.now(timezone.utc),
    )
    db.add(rec)
    db.commit()

    return VerificationResponse(
        is_authenticated=res.get('is_authenticated', False),
        is_tampered=res.get('is_tampered', False),
        owner_id=res.get('owner_id_found'),
        designer_name=res.get('designer_found'),
        model_id=res.get('model_id_found'),
        copyright_info=res.get('copyright_found'),
        watermark_id=res.get('watermark_id'),
        watermark_timestamp=res.get('watermark_timestamp'),
        integrity_score=res.get('integrity_score', 0.0),
        tampering_percentage=res.get('tampering_percentage', 0.0),
        confidence_score=res.get('confidence_score', 0.0),
        vertex_changes=res.get('vertex_changes', 0),
        face_changes=res.get('face_changes', 0),
        hmac_valid=res.get('hmac_valid', False),
        details=str(res.get('details', '')),
    )


@router.post('/api/models/tamper-test', response_model=TamperResponse)
def tamper_test(req: TamperRequest, db: Session = Depends(get_db)):
    model = db.query(CADModel).filter(CADModel.id == req.model_id).first()
    if not model or not model.watermarked_file_path:
        raise HTTPException(status_code=404, detail="Watermarked model not found")

    ext = os.path.splitext(model.watermarked_file_path)[1] or '.stl'
    out_path = os.path.join(
        os.path.dirname(model.watermarked_file_path),
        f"tampered_{req.tamper_mode}_{model.id}{ext}"
    )

    tamper_info = simulate_tampering(model.watermarked_file_path, out_path, req.tamper_mode)

    # Run verification on the tampered model to get real integrity score
    post_verify = verify_model(out_path, model)
    current_integrity = post_verify.get('integrity_score', 75.0)
    original_integrity = model.integrity_score or 99.8

    status_str = "TAMPERING DETECTED" if current_integrity < 85 else "MODIFIED"

    # Record this as a verification event
    rec = VerificationRecord(
        id=str(uuid.uuid4()),
        model_db_id=model.id,
        verified_filename=os.path.basename(out_path),
        is_authenticated=False,
        is_tampered=True,
        integrity_score=current_integrity,
        tampering_percentage=100.0 - current_integrity,
        confidence_score=current_integrity,
        vertex_changes=tamper_info.get('vertices_modified', 0),
        face_changes=0,
        details=json.dumps(tamper_info),
        verified_at=datetime.now(timezone.utc),
    )
    db.add(rec)
    db.commit()

    cleanup_temp_file(out_path)

    return TamperResponse(
        original_integrity=round(original_integrity, 2),
        current_integrity=round(current_integrity, 2),
        status=status_str,
        details={
            **tamper_info,
            "original_integrity": round(original_integrity, 2),
            "current_integrity": round(current_integrity, 2),
            "integrity_drop": round(original_integrity - current_integrity, 2),
            "status": status_str,
        }
    )


@router.get('/api/verification/history')
def get_history(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    records = db.query(VerificationRecord).order_by(
        VerificationRecord.verified_at.desc()
    ).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "model_db_id": r.model_db_id,
            "verified_filename": r.verified_filename,
            "is_authenticated": r.is_authenticated,
            "is_tampered": r.is_tampered,
            "owner_id_found": r.owner_id_found,
            "integrity_score": r.integrity_score,
            "confidence_score": r.confidence_score,
            "verified_at": r.verified_at.isoformat() if r.verified_at else None,
        }
        for r in records
    ]

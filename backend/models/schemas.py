from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ══════════════════════════════════════════════════════
#  AUTH SCHEMAS
# ══════════════════════════════════════════════════════

class SignupRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    full_name: str
    organization: Optional[str] = None  # maps to college_company on creation


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    """All editable profile fields. email and user_id are NOT here — they are immutable."""
    full_name:       Optional[str] = None
    phone:           Optional[str] = None
    college_company: Optional[str] = None
    department:      Optional[str] = None
    designation:     Optional[str] = None
    location:        Optional[str] = None
    bio:             Optional[str] = None
    profile_photo:   Optional[str] = None  # base64 data-url or relative URL


class UserInfo(BaseModel):
    """Compact user info returned in auth tokens / Navbar."""
    id:              str
    user_id:         str          # immutable OWN-XXXX-XXXX
    email:           str          # non-editable
    full_name:       str
    phone:           Optional[str] = None
    college_company: Optional[str] = None
    department:      Optional[str] = None
    designation:     Optional[str] = None
    location:        Optional[str] = None
    bio:             Optional[str] = None
    profile_photo:   Optional[str] = None
    created_at:      Optional[datetime] = None
    updated_at:      Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token:      str
    token_type: str = "bearer"
    user:       UserInfo


class PublicCreatorProfile(BaseModel):
    """Public-facing creator info — no password or private data."""
    user_id:         str
    full_name:       str
    college_company: Optional[str] = None
    department:      Optional[str] = None
    designation:     Optional[str] = None
    location:        Optional[str] = None
    bio:             Optional[str] = None
    profile_photo:   Optional[str] = None
    created_at:      Optional[datetime] = None


# ══════════════════════════════════════════════════════
#  MODEL / PROJECT SCHEMAS
# ══════════════════════════════════════════════════════

class ModelUploadResponse(BaseModel):
    id:           str
    filename:     str
    status:       str
    message:      str
    vertex_count: Optional[int] = None
    face_count:   Optional[int] = None
    file_format:  Optional[str] = None
    mesh_info:    Optional[Dict[str, Any]] = None


class WatermarkRequest(BaseModel):
    model_id:       str
    # creator fields are still accepted for demo/fallback mode
    # but will be OVERRIDDEN by the authenticated user's profile
    owner_id:       Optional[str] = None
    designer_name:  Optional[str] = None
    model_id_str:   Optional[str] = None
    project_name:   Optional[str] = None
    copyright_info: Optional[str] = None
    secret_key:     Optional[str] = None


class WatermarkResponse(BaseModel):
    watermark_id:        str
    project_id:          Optional[str] = None
    integrity_score:     float
    distortion_pct:      float
    processing_time:     float
    download_url:        str
    vertex_count:        int
    face_count:          int
    watermarked_vertices: Optional[int] = None
    timestamp:           Optional[str] = None
    creator_name:        Optional[str] = None
    creator_user_id:     Optional[str] = None


class VerificationResponse(BaseModel):
    is_authenticated:    bool
    is_tampered:         bool
    owner_id:            Optional[str] = None
    designer_name:       Optional[str] = None
    model_id:            Optional[str] = None
    copyright_info:      Optional[str] = None
    watermark_id:        Optional[str] = None
    watermark_timestamp: Optional[str] = None
    integrity_score:     float
    tampering_percentage: float
    confidence_score:    float
    vertex_changes:      Optional[int] = 0
    face_changes:        Optional[int] = 0
    hmac_valid:          Optional[bool] = None
    details:             str


class TamperRequest(BaseModel):
    model_id:    str
    tamper_mode: str
    severity:    Optional[float] = 0.3


class TamperResponse(BaseModel):
    original_integrity: float
    current_integrity:  float
    status:             str
    details:            Dict[str, Any]


class ModelListItem(BaseModel):
    id:                str
    project_id:        Optional[str] = None
    project_name:      Optional[str] = None
    name:              str
    original_filename: Optional[str] = None
    owner_id:          Optional[str] = None
    creator_user_id:   Optional[str] = None
    creator_name:      Optional[str] = None
    designer_name:     Optional[str] = None
    model_id_str:      Optional[str] = None
    status:            str
    integrity_score:   float
    vertex_count:      Optional[int] = None
    face_count:        Optional[int] = None
    file_format:       Optional[str] = None
    created_at:        datetime

    class Config:
        from_attributes = True


class ProjectVerificationResponse(BaseModel):
    """Returned from the public /project-verify/{project_id} endpoint."""
    is_verified:       bool
    message:           str
    project_id:        Optional[str] = None
    project_name:      Optional[str] = None
    creator_name:      Optional[str] = None
    creator_user_id:   Optional[str] = None
    creator_email:     Optional[str] = None  # shown only if public
    creator_college:   Optional[str] = None
    profile_photo:     Optional[str] = None
    created_at:        Optional[datetime] = None
    status:            Optional[str] = None
    integrity_score:   Optional[float] = None


class DashboardStats(BaseModel):
    total_models:       int
    watermarks_embedded: int
    verified:           int
    tampered:           int
    avg_integrity:      float
    verification_rate:  Optional[float] = 0.0


class AnalyticsData(BaseModel):
    geometry_distortion:     float
    vertex_change_count:     int
    face_change_count:       int
    watermark_robustness:    float
    integrity_score:         float
    authentication_confidence: float
    printability_score:      float
    vertex_distribution:     List[float]
    face_area_distribution:  List[float]
    vertex_count:            int
    face_count:              int

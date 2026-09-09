from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from .db import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id               = Column(String,   primary_key=True, default=generate_uuid)
    # Permanent, immutable public identifier (OWN-XXXX-XXXX)
    user_id          = Column(String,   unique=True, index=True, nullable=False)
    # Non-editable after registration
    email            = Column(String,   unique=True, index=True, nullable=False)
    password_hash    = Column(String,   nullable=False)
    # Editable profile fields
    full_name        = Column(String,   nullable=False)
    phone            = Column(String,   nullable=True)
    college_company  = Column(String,   nullable=True)
    department       = Column(String,   nullable=True)
    designation      = Column(String,   nullable=True)
    location         = Column(String,   nullable=True)
    bio              = Column(Text,     nullable=True)
    # Profile photo stored as relative URL or base64 data-url
    profile_photo    = Column(Text,     nullable=True)
    # Timestamps
    created_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at       = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    models = relationship("CADModel", back_populates="user", foreign_keys="CADModel.user_db_id")


class CADModel(Base):
    __tablename__ = "cad_models"

    id                   = Column(String,  primary_key=True, default=generate_uuid)
    # Human-readable project identifier (PRJ-XXXX-XXXX)
    project_id           = Column(String,  unique=True, index=True, nullable=True)
    # Project / model display name
    project_name         = Column(String,  nullable=True)
    name                 = Column(String,  index=True)
    original_filename    = Column(String)
    watermarked_filename = Column(String,  nullable=True)
    file_format          = Column(String)
    # Creator identity — immutably attached from the logged-in user at embed time
    user_db_id           = Column(String,  ForeignKey("users.id"), nullable=True)
    creator_user_id      = Column(String,  index=True, nullable=True)  # OWN-XXXX-XXXX
    creator_name         = Column(String,  nullable=True)
    creator_email        = Column(String,  nullable=True)
    creator_college      = Column(String,  nullable=True)
    # Legacy / compatibility columns
    owner_id             = Column(String,  nullable=True)
    designer_name        = Column(String,  nullable=True)
    model_id_str         = Column(String,  nullable=True)
    copyright_info       = Column(String,  nullable=True)
    secret_key_hash      = Column(String,  nullable=True)
    # File paths
    original_file_path   = Column(String,  nullable=True)
    watermarked_file_path= Column(String,  nullable=True)
    # Hashes & metadata
    original_hash        = Column(String,  nullable=True)
    watermark_hash       = Column(String,  nullable=True)
    watermark_metadata   = Column(Text,    nullable=True)
    # Quality metrics
    integrity_score      = Column(Float,   default=100.0)
    distortion_percentage= Column(Float,   default=0.0)
    vertex_count         = Column(Integer, nullable=True)
    face_count           = Column(Integer, nullable=True)
    processing_time      = Column(Float,   nullable=True)
    # Status lifecycle: uploaded → watermarked → verified
    status               = Column(String,  default="uploaded")
    created_at           = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at           = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                                  onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="models", foreign_keys=[user_db_id])


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id                 = Column(String,  primary_key=True, default=generate_uuid)
    model_db_id        = Column(String,  ForeignKey("cad_models.id"), nullable=True)
    verified_filename  = Column(String,  nullable=True)
    is_authenticated   = Column(Boolean)
    is_tampered        = Column(Boolean)
    owner_id_found     = Column(String,  nullable=True)
    designer_found     = Column(String,  nullable=True)
    model_id_found     = Column(String,  nullable=True)
    watermark_timestamp= Column(String,  nullable=True)
    integrity_score    = Column(Float)
    tampering_percentage= Column(Float)
    confidence_score   = Column(Float)
    vertex_changes     = Column(Integer)
    face_changes       = Column(Integer)
    details            = Column(String,  nullable=True)
    verified_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))

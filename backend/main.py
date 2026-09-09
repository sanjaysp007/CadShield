from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from database.db import init_db
from utils.file_utils import ensure_dirs
from routers import models, watermark, verification, auth

PHOTOS_DIR = os.path.join(os.path.dirname(__file__), "profile_photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_dirs()
    os.makedirs(PHOTOS_DIR, exist_ok=True)
    init_db()
    yield

app = FastAPI(title="CADShield API", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ensure_dirs()
app.mount("/uploads",        StaticFiles(directory="uploads"),        name="uploads")
app.mount("/processed",      StaticFiles(directory="processed"),      name="processed")
app.mount("/profile_photos", StaticFiles(directory=PHOTOS_DIR),       name="profile_photos")

app.include_router(auth.router)
app.include_router(models.router)
app.include_router(watermark.router)
app.include_router(verification.router)

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.1.0"}

@app.get("/")
def root():
    return {"status": "CADShield API running", "auth": "JWT + Profile + Projects enabled"}

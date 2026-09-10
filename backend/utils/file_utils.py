import os
import re

ALLOWED_EXTENSIONS = {'stl', 'obj', 'ply', 'off', 'pdf', 'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(filename: str, file_size: int) -> tuple[bool, str]:
    if file_size > MAX_FILE_SIZE:
        return False, "File too large"
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return False, "Invalid file extension"
    return True, ""

def get_safe_filename(original_name: str) -> str:
    name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', original_name)
    return name

def get_upload_path(filename: str) -> str:
    return os.path.abspath(os.path.join("uploads", filename))

def get_processed_path(filename: str) -> str:
    return os.path.abspath(os.path.join("processed", filename))

def cleanup_temp_file(path: str) -> None:
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass

def ensure_dirs() -> None:
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("processed", exist_ok=True)

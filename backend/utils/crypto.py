import hashlib, hmac, json, uuid
from datetime import datetime, timezone

def generate_model_hash(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()

def generate_watermark_id() -> str:
    return str(uuid.uuid4())

def generate_hmac_signature(data: dict, secret_key: str) -> str:
    msg = json.dumps(data, sort_keys=True).encode('utf-8')
    key = secret_key.encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def verify_hmac_signature(data: dict, signature: str, secret_key: str) -> bool:
    expected = generate_hmac_signature(data, secret_key)
    return hmac.compare_digest(expected, signature)

def build_ownership_payload(owner_id: str, designer_name: str, model_id: str, copyright_info: str, watermark_id: str, timestamp: str) -> dict:
    return {
        "owner_id": owner_id,
        "designer_name": designer_name,
        "model_id": model_id,
        "copyright_info": copyright_info,
        "watermark_id": watermark_id,
        "timestamp": timestamp
    }

def hash_secret_key(key: str) -> str:
    return hashlib.sha256(key.encode('utf-8')).hexdigest()

def generate_verification_token(model_hash: str, watermark_hash: str) -> str:
    return hashlib.sha256(f"{model_hash}:{watermark_hash}".encode('utf-8')).hexdigest()

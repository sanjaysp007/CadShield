import trimesh, numpy as np, json, time, uuid
from datetime import datetime, timezone
from utils.crypto import *

DEFAULT_SECRET = 'cadshield-demo-key-2024'
WATERMARK_STRENGTH = 0.0008  # fraction of bounding box diagonal

def embed_watermark(model_path: str, output_path: str, ownership: dict, secret_key: str = None) -> dict:
    start = time.time()
    key = secret_key or DEFAULT_SECRET
    
    mesh = trimesh.load(model_path, force='mesh')
    
    watermark_id = generate_watermark_id()
    timestamp = datetime.now(timezone.utc).isoformat()
    
    payload = build_ownership_payload(
        owner_id=ownership['owner_id'],
        designer_name=ownership['designer_name'],
        model_id=ownership['model_id'],
        copyright_info=ownership['copyright_info'],
        watermark_id=watermark_id,
        timestamp=timestamp
    )
    
    signature = generate_hmac_signature(payload, key)
    
    sig_bytes = bytes.fromhex(signature)
    scale = np.linalg.norm(mesh.bounds[1] - mesh.bounds[0])
    strength = scale * WATERMARK_STRENGTH
    
    rng_seed = int(signature[:8], 16)
    rng = np.random.RandomState(rng_seed)
    n_vertices = len(mesh.vertices)
    n_watermark = min(len(sig_bytes) * 3, n_vertices // 4)
    target_indices = rng.choice(n_vertices, size=n_watermark, replace=False)
    
    perturbations = np.zeros_like(mesh.vertices)
    bit_stream = []
    for byte in sig_bytes:
        for bit in range(8):
            bit_stream.append((byte >> bit) & 1)
    
    for i, idx in enumerate(target_indices):
        bit_idx = (i * 3) % len(bit_stream)
        dx = strength * (1 if bit_stream[bit_idx] else -1)
        dy = strength * (1 if bit_stream[(bit_idx+1) % len(bit_stream)] else -1)
        dz = strength * (1 if bit_stream[(bit_idx+2) % len(bit_stream)] else -1)
        perturbations[idx] = [dx, dy, dz]
    
    mesh.vertices = mesh.vertices + perturbations
    mesh.export(output_path)
    
    max_distortion = np.max(np.linalg.norm(perturbations, axis=1))
    distortion_pct = (max_distortion / scale) * 100 if scale > 0 else 0
    integrity_score = max(0.0, 100.0 - distortion_pct * 10)
    
    elapsed = time.time() - start
    
    return {
        'watermark_id': watermark_id,
        'signature': signature,
        'payload': payload,
        'vertex_count': n_vertices,
        'face_count': len(mesh.faces),
        'watermarked_vertices': int(n_watermark),
        'distortion_percentage': round(distortion_pct, 4),
        'integrity_score': round(integrity_score, 2),
        'processing_time': round(elapsed, 3),
        'scale': float(scale),
        'strength': float(strength),
        'timestamp': timestamp,
    }

def get_mesh_info(model_path: str) -> dict:
    try:
        mesh = trimesh.load(model_path, force='mesh')
        bounds = mesh.bounds
        dims = bounds[1] - bounds[0]
        return {
            'vertex_count': len(mesh.vertices),
            'face_count': len(mesh.faces),
            'is_watertight': bool(mesh.is_watertight),
            'volume': float(mesh.volume) if mesh.is_watertight else None,
            'surface_area': float(mesh.area),
            'bounds_min': bounds[0].tolist(),
            'bounds_max': bounds[1].tolist(),
            'dimensions': dims.tolist(),
            'centroid': mesh.centroid.tolist(),
        }
    except Exception as e:
        return {}

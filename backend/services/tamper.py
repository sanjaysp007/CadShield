import trimesh, numpy as np, shutil

def simulate_tampering(model_path: str, output_path: str, mode: str, severity: float = 0.3) -> dict:
    mesh = trimesh.load(model_path, force='mesh')
    n_vertices = len(mesh.vertices)
    scale = np.linalg.norm(mesh.bounds[1] - mesh.bounds[0])
    
    mask = np.zeros(n_vertices, dtype=bool)
    n_modify = 0
    
    if mode == 'vertex':
        n_modify = max(1, int(n_vertices * severity))
        indices = np.random.choice(n_vertices, size=n_modify, replace=False)
        noise = np.random.randn(n_modify, 3) * scale * 0.02
        mesh.vertices[indices] += noise
        mask[indices] = True
        
    elif mode == 'geometry':
        center = mesh.centroid
        mask = mesh.vertices[:, 0] > center[0]
        mesh.vertices[mask] *= (1 + severity * 0.5)
        n_modify = mask.sum()
        
    elif mode == 'watermark':
        n_modify = max(1, int(n_vertices * severity * 0.5))
        indices = np.arange(n_modify)
        mesh.vertices[indices] += np.random.randn(n_modify, 3) * scale * 0.05
        mask[indices] = True
        
    elif mode == 'partial':
        min_z = mesh.vertices[:, 2].min()
        max_z = mesh.vertices[:, 2].max()
        cutoff = min_z + (max_z - min_z) * severity
        mask = mesh.vertices[:, 2] < cutoff
        mesh.vertices[mask] += np.random.randn(mask.sum(), 3) * scale * 0.03
        n_modify = mask.sum()
    
    mesh.export(output_path)
    return {
        'mode': mode,
        'vertices_modified': int(n_modify),
        'total_vertices': n_vertices,
        'modification_strength': severity,
        'scale_used': float(scale)
    }

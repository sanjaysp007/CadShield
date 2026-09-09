import trimesh
import numpy as np
import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import SessionLocal, init_db
from database.models import CADModel
from utils.file_utils import ensure_dirs
from services.watermark import embed_watermark

def generate():
    init_db()
    ensure_dirs()
    db = SessionLocal()
    
    m1 = trimesh.creation.box(extents=[10, 10, 2])
    m2 = trimesh.creation.cylinder(radius=5, height=2)
    m3 = trimesh.creation.icosphere(radius=5)
    
    m1.export('uploads/demo_bracket.stl')
    m2.export('uploads/demo_gear.stl')
    m3.export('uploads/demo_housing.stl')
    
    models = [
        ('demo_bracket.stl', 'uploads/demo_bracket.stl'),
        ('demo_gear.stl', 'uploads/demo_gear.stl'),
        ('demo_housing.stl', 'uploads/demo_housing.stl'),
    ]
    
    for name, path in models:
        db_model = CADModel(
            name=name,
            original_filename=name,
            file_format='stl',
            original_file_path=os.path.abspath(path),
            vertex_count=100,
            face_count=200
        )
        db.add(db_model)
        db.commit()
        
        ownership = {
            'owner_id': 'demo-owner',
            'designer_name': 'Demo Designer',
            'model_id': db_model.id,
            'copyright_info': '(c) 2024 Demo'
        }
        
        out_path = os.path.abspath(f"processed/wm_{name}")
        embed_watermark(path, out_path, ownership)
        db_model.watermarked_file_path = out_path
        db_model.status = 'watermarked'
        db.commit()
    print("Demo data generated.")

if __name__ == '__main__':
    generate()

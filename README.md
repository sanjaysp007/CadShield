# 🛡️ CADShield – Secure 3D Model Watermarking & Authentication System

> **⚠️ Research Prototype Disclaimer**: CADShield is an academic demonstration of 3D model watermarking concepts. The vertex LSB perturbation + HMAC-SHA256 approach is a research-grade technique suitable for educational purposes. This is **not production-ready cryptographic security**.

---

## 🎯 Project Overview

CADShield demonstrates a complete digital watermarking pipeline for CAD/3D models:

```
Upload CAD Model
     ↓
Enter Ownership Information
     ↓
Generate HMAC-SHA256 Signature
     ↓
Embed Watermark (vertex perturbation)
     ↓
Download Protected Model
     ↓
Upload Model for Verification
     ↓
Extract Watermark Pattern
     ↓
Authenticate Owner
     ↓
Calculate Integrity Score
     ↓
Detect Tampering
     ↓
Show Security Report
```

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| Frontend     | React 18 + Vite + Tailwind CSS      |
| 3D Viewer    | Three.js + @react-three/fiber       |
| Charts       | Chart.js + react-chartjs-2          |
| Animations   | Framer Motion                       |
| Backend      | Python 3.10+ + FastAPI + Uvicorn    |
| 3D Processing| trimesh + NumPy                     |
| Cryptography | hashlib + HMAC (Python stdlib)      |
| Database     | SQLite via SQLAlchemy               |
| File Upload  | python-multipart                    |

---

## 📁 Project Structure

```
cadshield/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── GlassCard.jsx
│   │   │   ├── NeonButton.jsx
│   │   │   ├── SecurityScore.jsx
│   │   │   ├── StepProgress.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── ModelUploader.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProcessingAnimation.jsx
│   │   ├── pages/               # 7 application pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmbedPage.jsx
│   │   │   ├── VerifyPage.jsx
│   │   │   ├── ViewerPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── HistoryPage.jsx
│   │   ├── utils/
│   │   │   └── api.js           # API layer with demo fallback
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Design system CSS
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/                     # FastAPI Python app
    ├── main.py                  # App entry point
    ├── database/
    │   ├── db.py                # SQLAlchemy + SQLite setup
    │   └── models.py            # ORM models
    ├── models/
    │   └── schemas.py           # Pydantic request/response models
    ├── routers/
    │   ├── models.py            # Upload, list, delete endpoints
    │   ├── watermark.py         # Embed, extract endpoints
    │   └── verification.py     # Verify, tamper-test, history
    ├── services/
    │   ├── watermark.py         # Core watermarking algorithm
    │   ├── verification.py     # Authentication logic
    │   ├── tamper.py            # Tampering simulation
    │   └── analytics.py        # Geometry metrics
    ├── utils/
    │   ├── crypto.py            # HMAC + hashing utilities
    │   └── file_utils.py       # Safe file handling
    ├── demo_data/
    │   └── generate_demo.py    # Generate synthetic STL models
    ├── uploads/                 # Uploaded model files
    ├── processed/               # Watermarked output files
    ├── requirements.txt
    └── start.bat                # Windows quick-start script
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **pip** and **npm**

### Backend Setup

```bash
cd cadshield/backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Generate demo STL models + seed database
python demo_data/generate_demo.py

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or on Windows, simply run:
```
start.bat
```

The API will be at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd cadshield/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be at: **http://localhost:5173**

---

## 🎮 Demo Mode

The frontend works **without the backend running** — it automatically detects if the API is unavailable and falls back to rich demo data.

To see the full working demo:
1. Start both backend and frontend
2. Navigate to http://localhost:5173
3. Click **"Upload CAD Model"**
4. Drop any `.stl`, `.obj`, `.ply`, or `.off` file
5. Fill in ownership details → Embed watermark → Download
6. Verify the downloaded model
7. Try tamper simulation

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/models/upload` | Upload a 3D model file |
| `POST` | `/api/watermark/embed` | Embed watermark into uploaded model |
| `POST` | `/api/watermark/extract` | Extract watermark from uploaded model |
| `POST` | `/api/models/verify` | Verify model authenticity |
| `POST` | `/api/models/tamper-test` | Simulate tampering on a model |
| `GET`  | `/api/models/` | List all models |
| `GET`  | `/api/models/{id}` | Get model details |
| `GET`  | `/api/models/dashboard/stats` | Dashboard statistics |
| `GET`  | `/api/models/analytics/{id}` | Model analytics |
| `GET`  | `/api/verification/history` | Verification history |
| `DELETE` | `/api/models/{id}` | Delete a model |

---

## 🔐 Watermarking Algorithm

### Embedding
1. Load the 3D mesh using `trimesh`
2. Build an **ownership payload** (owner ID, designer, model ID, copyright, UUID, timestamp)
3. Compute an **HMAC-SHA256 signature** over the payload using a secret key
4. Use the first 8 hex chars of the signature as an **RNG seed** to deterministically select **target vertex indices** (up to N/4 vertices)
5. Convert the signature bytes to a **bit stream**
6. Apply **vertex perturbations** of magnitude `0.0008 × bounding box diagonal` with signs determined by the bit stream
7. Export the watermarked mesh
8. Store verification metadata in SQLite

### Verification
1. Load the candidate mesh
2. Re-derive the **expected perturbation pattern** from stored metadata
3. Compute **cosine similarity** between expected and actual perturbation directions at target vertices
4. Validate the **HMAC signature** against stored payload
5. Calculate **integrity score** = agreement × 100%
6. Threshold: `>90%` = Authenticated, `70-90%` = Modified, `<70%` = Tampered

### Tamper Detection
Modes simulate:
- **Vertex modification**: random noise on N% of vertices
- **Geometry modification**: scale a mesh region
- **Watermark corruption**: target watermark-bearing vertices
- **Partial modification**: replace a mesh slab with noise

---

## 📊 Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| STL Binary/ASCII | `.stl` | Most common 3D printing format |
| Wavefront OBJ | `.obj` | With/without material files |
| Stanford PLY | `.ply` | Binary and ASCII |
| Object File Format | `.off` | Simple polygon format |

---

## 🎨 Design System

- **Background**: `#0a0e1a` (deep navy)
- **Primary accent**: `#00d4ff` (neon cyan)
- **Secondary accent**: `#7c3aed` (neon purple)
- **Font**: Inter (Google Fonts)
- **Cards**: Glassmorphism (`backdrop-filter: blur(12px)`)
- **Animations**: Framer Motion page transitions + CSS keyframes

---

## 🗄️ Database Schema

### `cad_models` table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String | Filename |
| `owner_id` | String | Owner identifier |
| `designer_name` | String | Designer full name |
| `watermark_metadata` | JSON String | Full watermark result dict |
| `integrity_score` | Float | 0–100 integrity percentage |
| `watermark_hash` | String | HMAC signature |
| `status` | String | uploaded / watermarked / verified |

### `verification_records` table
Stores every verification attempt with full metrics.

> **PostgreSQL migration**: Change `DATABASE_URL` in `.env` to a Postgres connection string. SQLAlchemy handles the rest automatically.

---

## 📝 License

Academic project · 2024 · CADShield Research Prototype

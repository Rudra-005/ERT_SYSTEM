# 🚑 Emergency Triage Assistant (ERT System)

> **AI-powered clinical decision support platform** for real-time emergency triage with sub-400ms response guarantees.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-teal?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Project](#running-the-project)
- [API Reference](#api-reference)
  - [Node.js Backend (Port 5001)](#nodejs-backend-port-5001)
  - [FastAPI Backend (Port 8000)](#fastapi-backend-port-8000)
- [Frontend Pages & Features](#frontend-pages--features)
- [AI & ML Components](#ai--ml-components)
- [Emergency Protocol Engine](#emergency-protocol-engine)
- [Performance & Latency](#performance--latency)
- [Environment Variables](#environment-variables)
- [Triage Modes](#triage-modes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Emergency Triage Assistant (ERT System)** is a full-stack, AI-augmented clinical decision support platform designed to assist medical professionals in emergency departments. It processes patient histories and emergency presentations to deliver structured triage recommendations, differential diagnoses, risk assessments, and physician guidance — all under strict latency targets.

The system integrates a **hybrid LLM pipeline** (Groq + Ollama), a **rule-based Emergency Protocol Engine**, an **Ultra-Fast RAG service** with intelligent caching, and a modern React dashboard — built to operate at production speed even under heavy clinical load.

---

## Key Features

| Feature | Description |
|---|---|
| ⚡ **Sub-400ms Triage** | Hybrid Groq + Ollama pipeline with aggressive caching to meet strict SLA |
| 🧠 **Hybrid LLM** | Groq (cloud, fast) + Ollama (local, `phi3:mini`) with automatic fallback |
| 🔬 **Emergency Protocol Engine** | Rule-based engine for 7 critical protocols (cardiac arrest, stroke, sepsis, etc.) |
| 📄 **RAG + PDF Ingestion** | Upload patient PDFs; chunked retrieval with FAISS (optional) or keyword-based fallback |
| 👥 **Patient Management** | Full patient portal with run-triage modal, vitals input, symptom checklist |
| 🔐 **Authentication** | Role-based access (doctor/admin) via React Auth Context |
| 📊 **Analytics Dashboard** | Real-time latency metrics, confidence gauges, token reduction charts |
| 📁 **Persistent Case History** | Triage results saved per session with patient metadata |
| 🔊 **Audio Alerts** | Critical emergency audio notifications |
| 🆚 **A/B Comparison Mode** | Side-by-side comparison of naive vs. optimized triage approaches |
| 📡 **Hallucination Verification** | Response verification layer with confidence scoring |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│          http://localhost:3000                               │
│   Pages: Dashboard | Patients | Patient Portal | RAG         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌─────────────────┐           ┌─────────────────────┐
│  Node.js Backend│           │  FastAPI Backend     │
│  Express.js     │           │  Python / Uvicorn    │
│  Port: 5001     │           │  Port: 8000          │
│                 │           │                      │
│  • Triage API   │           │  • RAG Chat API      │
│  • Hybrid LLM   │           │  • PDF Ingestion     │
│  • Compression  │           │  • Ultra-Fast Cache  │
│  • Verification │           │  • Case History      │
│  • History      │           │  • Protocol Engine   │
└────────┬────────┘           └──────────┬──────────┘
         │                               │
   ┌─────┴──────┐                ┌───────┴──────┐
   ▼            ▼                ▼              ▼
 Groq API    Ollama           Groq API      Ollama
 (Cloud)   (Local:11434)     (Cloud)    (Local:11434)
              phi3:mini                    phi3:mini
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Dev server & bundler |
| **React Router v7** | Client-side routing |
| **Framer Motion** | Animations & transitions |
| **Recharts** | Analytics charts |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **TailwindCSS 3** | Utility CSS framework |

### Node.js Backend
| Technology | Purpose |
|---|---|
| **Express.js** | HTTP server & routing |
| **Groq SDK** | Primary LLM API for fast inference |
| **Ollama** | Local LLM inference (`phi3:mini`) |
| **Helmet** | HTTP security headers |
| **Morgan** | Request logging |
| **dotenv** | Environment config |
| **multer** | PDF file upload handling |
| **pdf-parse** | PDF text extraction |

### FastAPI Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async HTTP API framework |
| **Uvicorn** | ASGI server |
| **Pydantic v2** | Data validation & settings |
| **aiofiles** | Async file I/O |
| **Sentence Transformers** | Embeddings (`all-MiniLM-L6-v2`) |
| **FAISS** | Vector similarity search (optional) |
| **Groq Python SDK** | Cloud LLM (`llama-3.1-8b-instant`) |
| **python-dotenv** | Environment config |

---

## Project Structure

```
emergency-triage-assistant/
├── backend/                          # Node.js Express backend (Port 5001)
│   ├── src/
│   │   ├── server.js                 # App entry point, route registration
│   │   ├── ollamaService.js          # Ollama warm-up & keep-alive pings
│   │   ├── prompts.js                # LLM system prompts
│   │   ├── routes/
│   │   │   ├── fastTriageOptimized.js # POST /api/triage (fast + detailed + naive)
│   │   │   ├── hybridTriage.js       # POST /api/hybrid (Groq+Ollama hybrid)
│   │   │   ├── ultraFast.js          # POST /api/ultra-fast
│   │   │   ├── health.js             # GET /api/health
│   │   │   ├── history.js            # GET/POST /api/history
│   │   │   ├── rag.js                # POST /api/rag
│   │   │   ├── logs.js               # GET /api/logs
<<<<<<< HEAD
│   │   │   └── keys.js               # GET /api/keys
=======
│   │   │   ├── keys.js               # GET /api/keys
│   │   │   └── ...
>>>>>>> 863a07a (updated project)
│   │   ├── services/
│   │   │   ├── hybridLLM.js          # Groq + Ollama routing with cache
│   │   │   ├── compression.js        # Token compression
│   │   │   ├── verification.js       # Hallucination verification
│   │   │   └── confidence.js         # Confidence scoring
│   │   ├── middleware/
│   │   │   ├── latency.js            # Strict SLA latency tracking
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── apiKeyMiddleware.js   # API key authentication
│   │   └── utils/
│   │       ├── logger.js             # Winston/Pino logging
│   │       └── tokenCounter.js       # Token counting utilities
<<<<<<< HEAD
│   ├── .env
=======
│   ├── .env                          # Environment variables
>>>>>>> 863a07a (updated project)
│   └── package.json
│
├── fastapi-backend/                  # Python FastAPI backend (Port 8000)
│   ├── app/
│   │   ├── main.py                   # FastAPI app + lifespan + CORS
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── emergency_protocol_engine.py  # Rule-based protocol detection
│   │   ├── routes/
│   │   │   ├── chat_patient.py       # POST /chat/patient/{id}
│   │   │   ├── upload_pdf.py         # POST /upload-pdf
│   │   │   ├── case_history.py       # GET /case-history
│   │   │   ├── query.py              # POST /query
│   │   │   └── retrieve.py           # POST /retrieve
│   │   ├── services/
<<<<<<< HEAD
│   │   │   ├── ultra_fast_rag_service.py  # 4-tier RAG pipeline
│   │   │   ├── groq_llm_service.py
│   │   │   ├── ollama_llm_service.py
│   │   │   ├── pdf_ingestion_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── retrieval_service.py
│   │   │   ├── fast_retrieval_service.py
│   │   │   └── cache_service.py
│   │   └── utils/
│   ├── data/
│   │   ├── pdfs/
│   │   └── faiss_indexes/
│   ├── venv/
=======
│   │   │   ├── ultra_fast_rag_service.py  # 4-tier RAG: cache→rules→pattern→fallback
│   │   │   ├── groq_llm_service.py   # Groq LLM integration
│   │   │   ├── ollama_llm_service.py # Ollama local LLM
│   │   │   ├── ollama_inference_service.py # Inference orchestration
│   │   │   ├── pdf_ingestion_service.py    # PDF chunking & indexing
│   │   │   ├── rag_pipeline.py       # RAG pipeline orchestration
│   │   │   ├── embedding_service.py  # Sentence embeddings
│   │   │   ├── retrieval_service.py  # FAISS retrieval
│   │   │   ├── fast_retrieval_service.py  # Keyword-based fast retrieval
│   │   │   └── cache_service.py      # Response cache management
│   │   └── utils/
│   ├── data/
│   │   ├── pdfs/                     # Uploaded patient PDFs
│   │   └── faiss_indexes/            # Vector indexes per patient
│   ├── venv/                         # Python virtual environment
>>>>>>> 863a07a (updated project)
│   ├── requirements.txt
│   └── .env
│
└── frontend/                         # React + Vite frontend (Port 3000)
    ├── src/
<<<<<<< HEAD
    │   ├── App.jsx                   # Main dashboard
    │   ├── main.jsx                  # React entry point + routing
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── PatientsView.jsx
    │   │   ├── PatientPortal.jsx
    │   │   ├── RAGPage.jsx
    │   │   └── UnauthorizedPage.jsx
    │   ├── components/
    │   │   ├── AnimatedMetricCard.jsx
    │   │   ├── ConfidenceGauge.jsx
    │   │   ├── LatencyDashboard.jsx
    │   │   ├── PatientChatBot.jsx
    │   │   ├── PDFScanner.jsx
=======
    │   ├── App.jsx                   # Main dashboard (Triage, Analytics, History)
    │   ├── main.jsx                  # React entry point + routing
    │   ├── index.css                 # Global styles & design system
    │   ├── pages/
    │   │   ├── LoginPage.jsx         # Auth login UI
    │   │   ├── PatientsView.jsx      # Patient list + triage modal
    │   │   ├── PatientPortal.jsx     # Per-patient chatbot & records
    │   │   ├── RAGPage.jsx           # RAG query interface
    │   │   └── UnauthorizedPage.jsx  # 403 page
    │   ├── components/
    │   │   ├── AnimatedMetricCard.jsx
    │   │   ├── CircularProgress.jsx
    │   │   ├── ConfidenceGauge.jsx
    │   │   ├── LatencyBarGraph.jsx
    │   │   ├── LatencyDashboard.jsx
    │   │   ├── ComparisonTable.jsx
    │   │   ├── ComparisonView.jsx
    │   │   ├── PatientChatBot.jsx
    │   │   ├── PDFScanner.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── ErrorNotification.jsx
    │   │   ├── JsonViewer.jsx
    │   │   ├── Settings.jsx
    │   │   ├── RAGDashboard.jsx
    │   │   ├── Navbar/UserBadge.jsx
>>>>>>> 863a07a (updated project)
    │   │   └── triage/
    │   │       ├── RunTriageModal.jsx
    │   │       ├── VitalsInput.jsx
    │   │       ├── SymptomChecklist.jsx
    │   │       └── TriageResults.jsx
<<<<<<< HEAD
    │   └── context/
    │       └── AuthContext.jsx
=======
    │   ├── context/
    │   │   └── AuthContext.jsx       # Auth state provider
    │   ├── utils/
    │   │   ├── apiClient.js          # API helper functions
    │   │   ├── axiosConfig.js        # Axios instance config
    │   │   └── sampleCases.js        # Pre-loaded clinical samples
    │   └── data/
    │       └── patients.js           # Static patient seed data
>>>>>>> 863a07a (updated project)
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.x | For the Express backend & React frontend |
| Python | ≥ 3.10 | For the FastAPI backend |
| Ollama | Latest | Pull `phi3:mini` model |
| npm | ≥ 9.x | Package manager |

#### Install Ollama and pull the model

```bash
# Install Ollama (macOS)
brew install ollama

# Pull the model
ollama pull phi3:mini

# Start Ollama server
ollama serve
```

---

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/Rudra-005/INTEL_PROJECT.git
cd INTEL_PROJECT/emergency-triage-assistant
```

#### 2. Install Node.js backend dependencies

```bash
cd backend
npm install
```

#### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

#### 4. Set up Python virtual environment and install dependencies

```bash
cd ../fastapi-backend
python -m venv venv
source venv/bin/activate          # macOS/Linux
# .\venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

---

### Running the Project

Open **three separate terminal windows** and run the following:

#### Terminal 1 — Node.js Backend (Port 5001)

```bash
cd emergency-triage-assistant/backend
npm start
```

Expected output:
```
✅ Loaded 34 comprehensive triage scenarios
✅ Loaded 11 chat response templates
Ollama model warm and ready
🚀 STRICT SLA Emergency Triage Assistant
Server running on port 5001
✅ Keep-alive background ping enabled for Ollama
🔥 Production ready with absolute <400ms guarantees.
```

#### Terminal 2 — FastAPI Backend (Port 8000)

```bash
cd emergency-triage-assistant/fastapi-backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:
```
✅ Loaded 7 cached RAG responses
✓ Groq LLM service initialized: llama-3.1-8b-instant
✓ Ultra-Fast RAG service initialized
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 3 — React Frontend (Port 3000)

```bash
cd emergency-triage-assistant/frontend
npx vite --host
```

Expected output:
```
VITE v5.x  ready in ~450ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

**Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## API Reference

### Node.js Backend (Port 5001)

#### Health Check

```
GET /health
```
Returns system status, uptime, and version.

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### Triage Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/triage` | Fast triage summary (<400ms target) |
| `POST` | `/api/triage/detailed` | Comprehensive triage with full clinical reasoning |
| `POST` | `/api/triage/naive` | Naive approach for comparison (no compression) |
| `POST` | `/api/triage/optimized` | Alias for the optimized `/api/triage` route |
| `POST` | `/api/hybrid` | Explicit Groq+Ollama hybrid triage |
| `POST` | `/api/ultra-fast` | Ultra-fast rule+cache triage |

**Request body for all triage endpoints:**
```json
{
  "patientHistory": "65-year-old male with hypertension...",
  "emergencyDescription": "Sudden onset chest pain radiating to left arm..."
}
```

**Response — fast triage:**
```json
{
  "success": true,
  "mode": "fast-summary",
  "data": {
    "recommendation": {
      "immediate_action": "Activate STEMI protocol immediately",
      "differential_diagnosis": ["STEMI", "NSTEMI", "Unstable Angina"],
      "supporting_evidence": "...",
      "risk_considerations": "Priority: Critical",
      "uncertainty_level": "Low",
      "case_summary": "..."
    },
    "performance": {
      "total_ms": 312,
      "compression_ms": 3,
      "recommendation_ms": 305,
      "provider": "groq",
      "fromCache": false,
      "grade": "🟢 EXCELLENT"
    },
    "tokenStats": { "reduction": "Aggressive Fast Mode" },
    "confidence": { "score": 95 }
  }
}
```

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### History

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/history` | Get all saved triage case histories |
| `POST` | `/api/history` | Save a triage result to history |

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### Comparison

```
POST /api/compare
```
Runs the same case through both naive and optimized pipelines and returns side-by-side results.

<<<<<<< HEAD
=======
---

#### RAG

```
POST /api/rag
```
Query the RAG pipeline with a question about a patient (requires API key middleware).

---

>>>>>>> 863a07a (updated project)
#### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Detailed system health with latency stats |
| `GET` | `/api/logs` | Retrieve recent request logs |
| `GET` | `/api/keys` | List registered API keys |

---

### FastAPI Backend (Port 8000)

#### Root & Health

```
GET /        → System info and cache stats
GET /health  → Performance metrics and service status
```

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### RAG Chat

```
POST /chat
```
<<<<<<< HEAD

=======
>>>>>>> 863a07a (updated project)
**Body:**
```json
{
  "patient_id": "patient_001",
  "query": "What medications is this patient on?",
  "mode": "emergency"
}
```
<<<<<<< HEAD

Response includes `answer`, `citations`, `confidence`, `recommendations`, and `latency`.
=======
**Response** includes `answer`, `citations`, `confidence`, `recommendations`, and `latency`.

---
>>>>>>> 863a07a (updated project)

#### PDF Ingestion

```
POST /upload-pdf
```
Upload a patient PDF (multipart/form-data). Chunks and indexes the document for RAG retrieval.

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### Patient Chat (Chatbot)

```
POST /chat/patient/{patient_id}
```
Direct patient-context chatbot endpoint for the Patient Portal.

<<<<<<< HEAD
=======
---

>>>>>>> 863a07a (updated project)
#### Case History

```
GET /case-history
```
<<<<<<< HEAD
=======
Returns the saved case history entries.

---
>>>>>>> 863a07a (updated project)

#### Performance

```
GET /performance
```
Returns detailed cache hit rates, rule hit rates, and performance statistics.

---

## Frontend Pages & Features

### 🏠 Dashboard (`/`)
<<<<<<< HEAD
Redirect: logged-in users → `/dashboard`, guests → `/login`

### 📊 Main Triage Dashboard (`/dashboard`)
- **Triage Analysis** — Submit patient case & get AI triage recommendation
- **Analytics** — Session-level usage metrics
- **Case History** — Persistent triage log

Supports auto-extraction of patient name/age, PDF upload, three analysis modes (Optimized / Detailed / A/B Compare), real-time latency, confidence, and token reduction visualizations.
=======
- **Redirect**: Logged-in users → `/dashboard`, guests → `/login`

### 📊 Main Triage Dashboard (`/dashboard`)
Sidebar navigation with:
- **Triage Analysis** — Submit patient case & get AI triage recommendation
- **Patients** — Navigate to patient list
- **Analytics** — Session-level usage metrics
- **Case History** — Persistent triage log

**Triage form supports:**
- Auto-extraction of patient name and age from medical history text
- PDF upload via the PDF Scanner component
- Three analysis modes (Optimized / Detailed / A/B Compare)
- Sample cardiac case loader
- Real-time latency, confidence, and token reduction visualizations
>>>>>>> 863a07a (updated project)

### 👥 Patients View (`/dashboard/patients`)
- Paginated list of patients with status badges
- Run Triage modal with: Vitals Input, Symptom Checklist, Clinical Notes
- Discharge patient action
- Per-patient navigation to the Patient Portal

### 🏥 Patient Portal (`/dashboard/patients/:id/portal`)
- Full patient detail view (demographics, vitals, allergies, medications)
<<<<<<< HEAD
- AI Chatbot (via FastAPI RAG) with real-time responses
=======
- AI Chatbot (via FastAPI RAG) with real-time streaming-style responses
>>>>>>> 863a07a (updated project)
- Emergency protocol alerts (triggered by the Protocol Engine)
- Case notes & quick-action buttons (labs, imaging, consults)
- Discharge summary generation

### 📄 RAG Page (`/rag`)
- Upload PDF documents for a patient
- Query the RAG system with free-text questions
- View cited sources and confidence scores

### 🔐 Login (`/login`)
- Secure credential-based login
- Role-based access control (`DOCTOR` / `ADMIN`)
- Guards unauthorized routes with a 403 page

---

## AI & ML Components

### Hybrid LLM Service (`hybridLLM.js`)

Routes requests intelligently between:
1. **In-memory cache** — sub-10ms response for repeated queries
<<<<<<< HEAD
2. **Groq API** (`llama-3.1-8b-instant`) — ~200–400ms cloud inference
=======
2. **Groq API** (`llama-3.1-8b-instant`) — ~200-400ms cloud inference
>>>>>>> 863a07a (updated project)
3. **Ollama** (`phi3:mini`) — local fallback if Groq is unavailable

### Text Compression

<<<<<<< HEAD
Medical history text is compressed before sending to the LLM to reduce token count while preserving clinical meaning, resulting in measurable token reduction shown in the `tokenStats` response.

### Hallucination Verification

A post-processing verification layer checks the LLM response against the input and assigns a verification score and status (`Verified` / `Mostly Verified` / `Needs Review`).
=======
Before sending to the LLM, medical history text is compressed to reduce token count while preserving clinical meaning — resulting in measurable token reduction shown in the `tokenStats` response.

### Hallucination Verification

A post-processing verification layer checks the LLM response against the input text and assigns a verification score and status (`Verified` / `Mostly Verified` / `Needs Review`).
>>>>>>> 863a07a (updated project)

### Confidence Scoring

Combines verification score and token reduction ratio to produce a final confidence percentage displayed in the UI.

### Ultra-Fast RAG Service (FastAPI)

A 4-tier resolution pipeline designed for sub-50ms:

| Tier | Method | Latency |
|---|---|---|
| 1 | **Exact cache lookup** | 0–5ms |
| 2 | **Rule-based engine** (medical rules) | 5–20ms |
| 3 | **Pattern matching** (keyword categories) | 10–50ms |
| 4 | **Smart contextual fallback** | <100ms |

---

## Emergency Protocol Engine

<<<<<<< HEAD
Located in `fastapi-backend/app/emergency_protocol_engine.py`, this rule-based engine detects and triggers 7 clinical emergency protocols:
=======
Located in `fastapi-backend/app/emergency_protocol_engine.py`, this rule-based engine detects and triggers 7 clinical emergency protocols based on vital signs, symptoms, allergies, medications, and clinical notes:
>>>>>>> 863a07a (updated project)

| Protocol | Key Trigger Conditions |
|---|---|
| **Cardiac Arrest** | Pulse < 30 bpm, or Pulse > 180 + SpO₂ < 85% |
| **Stroke** | GCS < 10, or ≥2 stroke symptoms within 4.5hr window |
| **Anaphylaxis** | Known allergies + respiratory symptoms < 1hr onset |
| **Hypertensive Crisis** | Systolic > 180 mmHg, or Diastolic > 120 mmHg |
| **Respiratory Failure** | SpO₂ < 90%, or RR > 30 or < 8 breaths/min |
| **Sepsis** | Temperature abnormal + Pulse > 100 + RR > 20 |
| **Trauma** | Trauma keywords in notes + Pain scale > 7 |

Each protocol returns:
- Protocol name & trigger reason
- Immediate actions list
- Severity (`CRITICAL` / `HIGH` / `MODERATE`)
- Intervention window (`0–5 min` / `5–15 min`)

---

## Performance & Latency

| Component | Target | Achieved |
|---|---|---|
| Fast Triage (cached) | < 50ms | ~0–10ms ✅ |
| Fast Triage (Groq) | < 400ms | ~200–350ms ✅ |
<<<<<<< HEAD
| Detailed Triage | < 500ms | ~400–500ms ✅ |
=======
| Detailed Triage | < 500ms | ~300–500ms ✅ |
>>>>>>> 863a07a (updated project)
| Protocol Engine | < 10ms | ~1–5ms ✅ |
| RAG Chat (cached) | < 50ms | ~5–15ms ✅ |
| PDF Ingestion | < 5s | ~1–3s ✅ |

Performance grade shown in every response:
- 🟢 **EXCELLENT** — < 400ms
<<<<<<< HEAD
- 🟡 **GOOD** — 400–500ms
=======
- 🟡 **GOOD** — 400–500ms
>>>>>>> 863a07a (updated project)
- 🔴 **SLOW** — > 600ms

---

## Environment Variables

### `backend/.env`

```env
PORT=5001
NODE_ENV=development

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Groq (optional — set if using Groq cloud)
# GROQ_API_KEY=your_groq_api_key_here
```

### `fastapi-backend/.env`

```env
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
EMBEDDING_MODEL=all-MiniLM-L6-v2
FAISS_INDEX_DIR=./data/faiss_indexes
PDF_STORAGE_DIR=./data/pdfs
CHUNK_SIZE=150
CHUNK_OVERLAP=25
TOP_K=2
```

> **Note:** Groq API keys can be obtained from [console.groq.com](https://console.groq.com). Ollama runs entirely locally with no API key required.

---

## Triage Modes

<<<<<<< HEAD
=======
The frontend offers three analysis modes selectable at runtime:

>>>>>>> 863a07a (updated project)
| Mode | Endpoint | Description |
|---|---|---|
| ⚡ **Optimized** | `POST /api/triage` | Fast summary with compression. Best for real-time emergencies |
| 🔬 **Detailed** | `POST /api/triage/detailed` | Full clinical reasoning including differential rationale, physician guidance, monitoring requirements |
| ⚖️ **A/B Compare** | `POST /api/compare` | Runs both naive and optimized approaches and presents side-by-side results |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

### Code Conventions

- **JavaScript**: ESModules, async/await, no CommonJS mixing in frontend
- **Python**: Type hints everywhere, Pydantic models for all request/response shapes
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`)

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built for Intel HP Project · AI-Powered Emergency Clinical Decision Support

</div>

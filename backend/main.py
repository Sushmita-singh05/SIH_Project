"""
QuantumLeap-AI FastAPI Server Entrypoint
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.circuit import router as circuit_router
from backend.api.ai import router as ai_router

app = FastAPI(
    title="QuantumLeap-AI Backend",
    version="0.1.0",
    description="Backend API engine supporting Qiskit quantum simulation and context-aware AI tutor explanations."
)

# Enable CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(circuit_router)
app.include_router(ai_router)

from backend.api.video import router as video_router
app.include_router(video_router)

from backend.api.progress import router as progress_router
app.include_router(progress_router)

from backend.api.challenge import router as challenge_router
app.include_router(challenge_router)



@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "QuantumLeap-AI backend"
    }


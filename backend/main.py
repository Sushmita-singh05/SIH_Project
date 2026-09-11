"""
QuantumLeap-AI FastAPI Server Entrypoint
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.circuit import router as circuit_router

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
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the circuit simulation router
app.include_router(circuit_router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "QuantumLeap-AI backend"
    }


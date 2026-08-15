from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.candidate import router as candidate_router
from app.api.conductor import router as conductor_router
from app.api.results import router as results_router

app = FastAPI(title="Truth vs Noise API", version="0.1.0")

# Minimal CORS configuration for Vite frontend development origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(conductor_router, prefix="/api/conductor", tags=["Conductor Event Management"])
app.include_router(candidate_router, prefix="/api/candidate", tags=["Candidate Event Browsing & Joining"])
app.include_router(results_router, prefix="/api/events", tags=["Election Results"])


@app.get("/")
def read_root():
    return {"message": "Truth vs Noise API is running"}

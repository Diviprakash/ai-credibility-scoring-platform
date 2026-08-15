from app.api.auth import router as auth_router
from app.api.candidate import router as candidate_router
from app.api.conductor import router as conductor_router
from app.api.results import router as results_router

__all__ = [
    "auth_router",
    "conductor_router",
    "candidate_router",
    "results_router",
]

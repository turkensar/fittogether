from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models import *  # noqa: F401 - import all models to register them
from app.routers import auth, pairing, meals, tracking, social, challenges, gamification
from app.seed.seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="FitTogether API",
    description="Couples diet companion app",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pairing.router)
app.include_router(meals.router)
app.include_router(tracking.router)
app.include_router(social.router)
app.include_router(challenges.router)
app.include_router(gamification.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "FitTogether"}

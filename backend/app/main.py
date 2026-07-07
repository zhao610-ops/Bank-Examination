from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import answers, exam_plan, metadata, questions, stats, wrong_questions
from app.seed_data import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metadata.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(wrong_questions.router)
app.include_router(stats.router)
app.include_router(exam_plan.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

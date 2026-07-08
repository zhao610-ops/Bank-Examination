from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import answers, exam_plan, llm, metadata, questions, stats, training, wrong_questions
from app.seed_data import seed_database


def ensure_dev_schema_columns() -> None:
    """开发环境轻量补列，避免旧 SQLite 库缺少新增字段。"""

    inspector = inspect(engine)
    if "user_answers" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("user_answers")}
    if "time_used" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE user_answers ADD COLUMN time_used INTEGER"))


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    Base.metadata.create_all(bind=engine)
    ensure_dev_schema_columns()
    with SessionLocal() as db:
        seed_database(db)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metadata.router)
app.include_router(llm.router)
app.include_router(questions.router)
app.include_router(answers.router)
app.include_router(wrong_questions.router)
app.include_router(stats.router)
app.include_router(exam_plan.router)
app.include_router(training.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import answers, exam_plan, llm, metadata, questions, stats, training, web_questions, wrong_questions
from app.seed_data import seed_database


def ensure_dev_schema_columns() -> None:
    """开发环境轻量补列，避免旧 SQLite 库缺少新增字段。"""

    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "user_answers" not in table_names:
        return
    columns = {column["name"] for column in inspector.get_columns("user_answers")}
    if "time_used" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE user_answers ADD COLUMN time_used INTEGER"))

    if "questions" not in table_names:
        return
    question_columns = {column["name"] for column in inspector.get_columns("questions")}
    column_sql = {
        "source_bank": "ALTER TABLE questions ADD COLUMN source_bank VARCHAR(100)",
        "exam_year": "ALTER TABLE questions ADD COLUMN exam_year INTEGER",
        "source_url": "ALTER TABLE questions ADD COLUMN source_url TEXT",
        "source_title": "ALTER TABLE questions ADD COLUMN source_title VARCHAR(300)",
        "retrieved_at": "ALTER TABLE questions ADD COLUMN retrieved_at DATETIME",
        "verification_status": "ALTER TABLE questions ADD COLUMN verification_status VARCHAR(20) DEFAULT 'unverified'",
        "confidence_score": "ALTER TABLE questions ADD COLUMN confidence_score FLOAT",
    }
    with engine.begin() as connection:
        for name, sql in column_sql.items():
            if name not in question_columns:
                connection.execute(text(sql))


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
app.include_router(web_questions.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}

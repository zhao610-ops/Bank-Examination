import os
from datetime import date, timedelta
from pathlib import Path

import pytest


TEST_DB = Path(__file__).parent / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ.pop("DEEPSEEK_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import delete  # noqa: E402

from app.config import get_settings  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import UserAnswer, UserStat  # noqa: E402
from app.services.llm_service import LLMService  # noqa: E402


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_complete_answer_flow() -> None:
    with TestClient(app) as client:
        assert client.get("/health").status_code == 200
        assert client.get("/api/banks").json()
        assert client.get("/api/categories").json()

        generated = client.post(
            "/api/questions/generate",
            json={
                "bank_type": "城商行",
                "target_bank": "广州银行",
                "job_type": "金融科技岗",
                "category": "EPI / 行测",
                "sub_category": "资料分析",
                "difficulty": "easy",
            },
        )
        assert generated.status_code == 201
        question = generated.json()
        assert set(question["options"]) == {"A", "B", "C", "D"}
        assert question["source_type"] == "mock"

        submitted = client.post(
            "/api/answers/submit",
            json={"question_id": question["id"], "user_answer": "A", "time_used": 12},
        )
        assert submitted.status_code == 200
        assert submitted.json()["is_correct"] is False
        wrong_questions = client.get("/api/wrong-questions").json()
        assert len(wrong_questions) >= 1
        assert {"bank_type", "target_bank", "job_type", "difficulty", "knowledge_point", "mistake_tips"} <= set(wrong_questions[0])
        assert client.get("/api/stats").json()["total_count"] >= 1

    with SessionLocal() as db:
        latest_answer = db.query(UserAnswer).order_by(UserAnswer.id.desc()).first()
        assert latest_answer is not None
        assert latest_answer.time_used == 12


def test_answer_submit_without_time_used_is_compatible() -> None:
    with TestClient(app) as client:
        generated = client.post(
            "/api/questions/generate",
            json={
                "bank_type": "城商行",
                "target_bank": "广州银行",
                "job_type": "金融科技岗",
                "category": "EPI / 行测",
                "sub_category": "资料分析",
                "difficulty": "easy",
            },
        )
        assert generated.status_code == 201
        submitted = client.post(
            "/api/answers/submit",
            json={"question_id": generated.json()["id"], "user_answer": "B"},
        )
        assert submitted.status_code == 200


def test_llm_status_does_not_leak_api_key(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "deepseek")
    monkeypatch.delenv("DEEPSEEK_API_KEY", raising=False)
    get_settings.cache_clear()

    with TestClient(app) as client:
        response = client.get("/api/llm/status")

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "deepseek"
    assert body["has_api_key"] is False
    assert body["status"] == "mock_fallback"
    assert "api_key" not in body


def test_llm_provider_mock_returns_mock(monkeypatch) -> None:
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setenv("ALLOW_LLM", "false")
    get_settings.cache_clear()

    with TestClient(app) as client:
        response = client.post(
            "/api/questions/generate",
            json={
                "bank_type": "股份制银行",
                "target_bank": "招商银行",
                "job_type": "综合岗",
                "category": "综合知识",
                "sub_category": "金融知识",
                "difficulty": "medium",
            },
        )

    assert response.status_code == 201
    body = response.json()
    assert body["source_type"] == "mock"
    assert body["llm_provider"] == "mock"


def test_llm_invalid_json_falls_back_to_mock(monkeypatch) -> None:
    async def fake_call_provider(self, messages, use_response_format=True):  # noqa: ANN001
        return '{"question": "", "options": {"A": "重复", "B": "重复", "C": "重复", "D": "重复"}, "answer": "E"}'

    monkeypatch.setenv("LLM_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "test-key")
    monkeypatch.setenv("ALLOW_LLM", "true")
    get_settings.cache_clear()
    monkeypatch.setattr(LLMService, "_call_provider", fake_call_provider)

    with TestClient(app) as client:
        response = client.post(
            "/api/questions/generate",
            json={
                "bank_type": "国有六大行",
                "target_bank": "工商银行",
                "job_type": "综合岗",
                "category": "EPI / 行测",
                "sub_category": "数字运算",
                "difficulty": "easy",
            },
        )

    assert response.status_code == 201
    body = response.json()
    assert body["source_type"] == "mock"
    assert body["llm_provider"] == "deepseek"


def test_exam_plan_flow_and_task_progress() -> None:
    with TestClient(app) as client:
        created = client.post(
            "/api/exam-plan/create",
            json={
                "exam_type": "秋招",
                "bank_type": "城商行",
                "target_bank": "广州银行",
                "job_type": "金融科技岗",
                "exam_date": (date.today() + timedelta(days=48)).isoformat(),
            },
        )
        assert created.status_code == 201
        assert created.json()["remaining_days"] == 48
        assert created.json()["current_stage"] == "专项强化期"

        current = client.get("/api/exam-plan/current")
        assert current.status_code == 200
        assert current.json()["target_bank"] == "广州银行"

        today = client.get("/api/exam-plan/today")
        assert today.status_code == 200
        task = today.json()["tasks"][0]
        assert task["completed_count"] == 0

        progress = client.get("/api/exam-plan/progress")
        assert progress.status_code == 200
        assert progress.json()["today_completion_rate"] == 0

        generated = client.post(
            "/api/questions/generate",
            json={
                "bank_type": "城商行",
                "target_bank": "广州银行",
                "job_type": "金融科技岗",
                "category": task["category"],
                "sub_category": task["sub_category"],
                "difficulty": "easy",
            },
        )
        assert generated.status_code == 201
        submitted = client.post(
            "/api/answers/submit",
            json={"question_id": generated.json()["id"], "user_answer": "A"},
        )
        assert submitted.status_code == 200

        updated_task = client.get("/api/exam-plan/today").json()["tasks"][0]
        assert updated_task["completed_count"] == 1
        assert client.get("/api/exam-plan/progress").json()["today_completion_rate"] > 0


def test_training_recommend_question_counts_by_minutes() -> None:
    with TestClient(app) as client:
        ranges = {
            15: (5, 9),
            30: (12, 17),
            60: (25, 32),
            90: (40, 52),
        }
        for minutes, (minimum, maximum) in ranges.items():
            response = client.post(
                "/api/training/recommend",
                json={
                    "exam_type": "秋招",
                    "bank_type": "城商行",
                    "target_bank": "广州银行",
                    "job_type": "综合岗",
                    "exam_date": (date.today() + timedelta(days=48)).isoformat(),
                    "daily_minutes": minutes,
                },
            )
            assert response.status_code == 200
            total = response.json()["total_question_count"]
            assert minimum <= total <= maximum
            assert sum(task["question_count"] for task in response.json()["tasks"]) == total


def test_training_recommend_fintech_contains_technical_task() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/training/recommend",
            json={
                "exam_type": "秋招",
                "bank_type": "城商行",
                "target_bank": "广州银行",
                "job_type": "金融科技岗",
                "exam_date": (date.today() + timedelta(days=48)).isoformat(),
                "daily_minutes": 30,
            },
        )
        assert response.status_code == 200
        sub_categories = {task["sub_category"] for task in response.json()["tasks"]}
        assert {"数据库 SQL", "计算机网络"} & sub_categories


def test_training_recommend_general_contains_epi_and_finance() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/training/recommend",
            json={
                "exam_type": "秋招",
                "bank_type": "国有六大行",
                "target_bank": "工商银行",
                "job_type": "综合岗",
                "exam_date": (date.today() + timedelta(days=70)).isoformat(),
                "daily_minutes": 30,
            },
        )
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        assert any(task["category"] == "EPI / 行测" for task in tasks)
        assert any(task["sub_category"] == "金融知识" for task in tasks)


def test_training_recommend_near_exam_increases_review() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/training/recommend",
            json={
                "exam_type": "春招",
                "bank_type": "股份制银行",
                "target_bank": "招商银行",
                "job_type": "综合岗",
                "exam_date": (date.today() + timedelta(days=6)).isoformat(),
                "daily_minutes": 60,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["current_stage"] == "考前稳定期"
        assert any(task["category"] == "错题复盘" or "高频" in task["reason"] for task in body["tasks"])
        assert any("减少新难题" in suggestion for suggestion in body["suggestions"])


def test_training_recommend_without_stats_returns_default_plan() -> None:
    with SessionLocal() as db:
        db.execute(delete(UserStat))
        db.commit()

    with TestClient(app) as client:
        response = client.post(
            "/api/training/recommend",
            json={
                "exam_type": "实习招聘",
                "bank_type": "农商行",
                "target_bank": "广州农商银行",
                "job_type": "柜员岗",
                "exam_date": (date.today() + timedelta(days=40)).isoformat(),
                "daily_minutes": 15,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["tasks"]
        assert body["estimated_minutes"] == 15
        assert any("暂无历史数据" in suggestion for suggestion in body["suggestions"])

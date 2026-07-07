import os
from datetime import date, timedelta
from pathlib import Path


TEST_DB = Path(__file__).parent / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ.pop("DEEPSEEK_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


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

        submitted = client.post(
            "/api/answers/submit",
            json={"question_id": question["id"], "user_answer": "A"},
        )
        assert submitted.status_code == 200
        assert submitted.json()["is_correct"] is False
        assert len(client.get("/api/wrong-questions").json()) >= 1
        assert client.get("/api/stats").json()["total_count"] >= 1


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

import os
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


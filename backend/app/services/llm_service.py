import json
import re

import httpx
from pydantic import ValidationError

from app.config import get_settings
from app.schemas import GeneratedQuestion, QuestionGenerateRequest


class LLMGenerationError(Exception):
    """模型出题失败。"""


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def generate_question(self, request: QuestionGenerateRequest) -> tuple[GeneratedQuestion, str]:
        """有密钥时调用 DeepSeek，否则返回本地模拟题。"""

        if not self.settings.deepseek_api_key:
            return self._build_mock_question(request), "mock"

        last_error = "未知错误"
        for _ in range(2):
            try:
                content = await self._call_deepseek(self._build_prompt(request))
                return self._parse_response(content), "llm"
            except (httpx.HTTPError, KeyError, TypeError, ValueError, ValidationError) as exc:
                last_error = str(exc)
        raise LLMGenerationError(f"模型连续两次未返回有效题目：{last_error}")

    async def _call_deepseek(self, prompt: str) -> str:
        url = f"{self.settings.deepseek_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.settings.deepseek_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.settings.deepseek_model,
            "messages": [
                {"role": "system", "content": "你是银行招聘笔试出题专家，只输出合法 JSON。"},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.7,
        }
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    @staticmethod
    def _parse_response(content: str) -> GeneratedQuestion:
        cleaned = content.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        data = json.loads(cleaned)
        return GeneratedQuestion.model_validate(data)

    @staticmethod
    def _build_prompt(request: QuestionGenerateRequest) -> str:
        return f"""你是银行招聘笔试出题专家。
请生成 1 道银行招聘笔试单选题。

要求：
1. 银行类型：{request.bank_type}
2. 目标银行：{request.target_bank}
3. 岗位类型：{request.job_type}
4. 一级模块：{request.category}
5. 二级题型：{request.sub_category}
6. 难度：{request.difficulty}
7. 题目必须符合银行校园招聘笔试风格
8. 选项 A-D，只有一个正确答案
9. 解析要清楚说明解题过程
10. 只能输出 JSON，不要输出多余文字

JSON 格式：
{{
  "bank_type": "{request.bank_type}",
  "target_bank": "{request.target_bank}",
  "job_type": "{request.job_type}",
  "category": "{request.category}",
  "sub_category": "{request.sub_category}",
  "difficulty": "{request.difficulty}",
  "question": "",
  "options": {{"A": "", "B": "", "C": "", "D": ""}},
  "answer": "",
  "explanation": "",
  "knowledge_point": "",
  "mistake_tips": ""
}}"""

    @staticmethod
    def _build_mock_question(request: QuestionGenerateRequest) -> GeneratedQuestion:
        """无 API Key 时提供可完整答题的演示题。"""

        return GeneratedQuestion(
            **request.model_dump(),
            question="某银行一年期存款年利率为 2%，客户存入 10,000 元，按单利计算，到期利息是多少？",
            options={"A": "100 元", "B": "200 元", "C": "500 元", "D": "1,000 元"},
            answer="B",
            explanation="单利利息=本金×年利率×期限，即 10,000×2%×1=200 元。",
            knowledge_point=f"{request.sub_category}：单利计算",
            mistake_tips="注意区分本金、本息和利息，题目只要求计算利息。",
        )


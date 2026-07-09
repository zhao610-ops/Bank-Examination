import json
import logging
import re
from dataclasses import dataclass
from typing import Any

import httpx
from pydantic import ValidationError

from app.config import get_settings
from app.schemas import GeneratedQuestion, QuestionGenerateRequest


logger = logging.getLogger(__name__)


class LLMGenerationError(Exception):
    """模型出题失败。"""


@dataclass
class LLMQuestionResult:
    question: GeneratedQuestion
    source_type: str
    llm_provider: str
    llm_model: str


def build_question_prompt(request: QuestionGenerateRequest) -> list[dict[str, str]]:
    """构造题目生成消息，要求模型只输出 JSON。"""

    schema = {
        "bank_type": request.bank_type,
        "target_bank": request.target_bank,
        "job_type": request.job_type,
        "category": request.category,
        "sub_category": request.sub_category,
        "difficulty": request.difficulty,
        "question": "",
        "options": {"A": "", "B": "", "C": "", "D": ""},
        "answer": "",
        "explanation": "",
        "knowledge_point": "",
        "mistake_tips": "",
    }
    return [
        {"role": "system", "content": "你是银行招聘笔试出题专家，只输出合法 JSON，不要输出解释性文字。"},
        {
            "role": "user",
            "content": (
                "请生成 1 道银行招聘笔试单选题。\n"
                f"银行类型：{request.bank_type}\n"
                f"目标银行：{request.target_bank}\n"
                f"岗位类型：{request.job_type}\n"
                f"一级模块：{request.category}\n"
                f"二级题型：{request.sub_category}\n"
                f"难度：{request.difficulty}\n"
                "要求：题目符合银行校园招聘笔试风格；A-D 四个选项只有一个正确答案；"
                "解析要说明解题过程；只能返回 JSON。\n"
                f"JSON 格式：{json.dumps(schema, ensure_ascii=False)}"
            ),
        },
    ]


def parse_json_response(raw_text: str) -> dict[str, Any]:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def validate_question_payload(data: dict[str, Any]) -> bool:
    try:
        GeneratedQuestion.model_validate(data)
    except ValidationError:
        return False
    return True


def normalize_question_payload(data: dict[str, Any], request: QuestionGenerateRequest) -> dict[str, Any]:
    normalized = {**data}
    for field in ("bank_type", "target_bank", "job_type", "category", "sub_category", "difficulty"):
        normalized[field] = getattr(request, field)

    options = normalized.get("options")
    if isinstance(options, dict):
        normalized["options"] = {key: str(options.get(key, "")).strip() for key in ("A", "B", "C", "D")}
    return normalized


class LLMService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def generate_question(self, request: QuestionGenerateRequest) -> LLMQuestionResult:
        """通过统一模型入口生成题目，失败时自动返回本地 mock。"""

        provider = self.settings.llm_provider
        model = self.settings.active_llm_model()
        if not self.settings.allow_llm or provider == "mock":
            return self._mock_result(request, provider="mock", model="mock")

        api_key = self.settings.active_api_key()
        if not api_key:
            if self.settings.use_mock_when_no_key:
                return self._mock_result(request, provider=provider, model=model)
            logger.warning("LLM API Key 未配置，provider=%s", provider)
            return self._mock_result(request, provider=provider, model=model)

        messages = build_question_prompt(request)
        for attempt in range(2):
            try:
                raw_text = await self._call_provider(messages, use_response_format=attempt == 0)
                data = normalize_question_payload(parse_json_response(raw_text), request)
                if not validate_question_payload(data):
                    raise ValueError("模型返回题目字段校验失败")
                return LLMQuestionResult(
                    question=GeneratedQuestion.model_validate(data),
                    source_type="ai_generated",
                    llm_provider=provider,
                    llm_model=model,
                )
            except (httpx.HTTPError, KeyError, TypeError, ValueError, ValidationError, json.JSONDecodeError) as exc:
                logger.warning("LLM 题目生成失败，provider=%s，attempt=%s，error=%s", provider, attempt + 1, exc)

        return self._mock_result(request, provider=provider, model=model)

    async def generate_study_advice(self, context: dict[str, Any]) -> str:
        """生成学习建议，暂未接入业务时提供本地规则兜底。"""

        if not self.settings.allow_llm or self.settings.llm_provider == "mock" or not self.settings.active_api_key():
            return "建议优先复盘错题，针对薄弱模块继续专项训练。"
        messages = [
            {"role": "system", "content": "你是银行笔试备考教练，请给出简短学习建议。"},
            {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
        ]
        try:
            return await self._call_provider(messages, use_response_format=False)
        except httpx.HTTPError as exc:
            logger.warning("LLM 学习建议生成失败：%s", exc)
            return "建议优先复盘错题，针对薄弱模块继续专项训练。"

    async def generate_exam_report_summary(self, context: dict[str, Any]) -> str:
        """生成模拟考试报告文案，暂未接入业务时提供本地兜底。"""

        if not self.settings.allow_llm or self.settings.llm_provider == "mock" or not self.settings.active_api_key():
            return "本次练习已完成，请结合正确率、错题和用时继续优化训练节奏。"
        messages = [
            {"role": "system", "content": "你是银行笔试测评分析师，请生成简短考试报告总结。"},
            {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
        ]
        try:
            return await self._call_provider(messages, use_response_format=False)
        except httpx.HTTPError as exc:
            logger.warning("LLM 报告总结生成失败：%s", exc)
            return "本次练习已完成，请结合正确率、错题和用时继续优化训练节奏。"

    async def _call_provider(self, messages: list[dict[str, str]], use_response_format: bool = True) -> str:
        if self.settings.llm_provider == "openai":
            return await self._call_openai(messages, use_response_format)
        if self.settings.llm_provider == "deepseek":
            return await self._call_deepseek(messages, use_response_format)
        return json.dumps(self._call_mock_dict(), ensure_ascii=False)

    async def _call_deepseek(self, messages: list[dict[str, str]], use_response_format: bool = True) -> str:
        return await self._call_openai_compatible(
            base_url=self.settings.deepseek_base_url,
            api_key=self.settings.deepseek_api_key or "",
            model=self.settings.active_llm_model(),
            messages=messages,
            use_response_format=use_response_format,
        )

    async def _call_openai(self, messages: list[dict[str, str]], use_response_format: bool = True) -> str:
        return await self._call_openai_compatible(
            base_url=self.settings.openai_base_url,
            api_key=self.settings.openai_api_key or "",
            model=self.settings.openai_model,
            messages=messages,
            use_response_format=use_response_format,
        )

    async def _call_openai_compatible(
        self,
        base_url: str,
        api_key: str,
        model: str,
        messages: list[dict[str, str]],
        use_response_format: bool,
    ) -> str:
        url = f"{base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
        }
        if use_response_format:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    def _mock_result(self, request: QuestionGenerateRequest, provider: str, model: str) -> LLMQuestionResult:
        return LLMQuestionResult(
            question=self._build_mock_question(request),
            source_type="ai_generated",
            llm_provider=provider,
            llm_model=model,
        )

    @staticmethod
    def _call_mock_dict() -> dict[str, Any]:
        return {
            "question": "某银行一年期存款年利率为 2%，客户存入 10,000 元，按单利计算，到期利息是多少？",
            "options": {"A": "100 元", "B": "200 元", "C": "500 元", "D": "1,000 元"},
            "answer": "B",
            "explanation": "单利利息=本金×年利率×期限，即 10,000×2%×1=200 元。",
            "knowledge_point": "单利计算",
            "mistake_tips": "注意区分本金、本息和利息，题目只要求计算利息。",
        }

    @classmethod
    def _build_mock_question(cls, request: QuestionGenerateRequest) -> GeneratedQuestion:
        """无 API Key 或模型失败时提供可完整答题的演示题。"""

        return GeneratedQuestion(
            **request.model_dump(),
            **cls._call_mock_dict(),
        )

from fastapi import APIRouter

from app.config import get_settings
from app.schemas import LLMStatusResponse


router = APIRouter(prefix="/api/llm", tags=["模型"])


@router.get("/status", response_model=LLMStatusResponse)
def get_llm_status() -> LLMStatusResponse:
    settings = get_settings()
    has_api_key = bool(settings.active_api_key())
    if not settings.allow_llm:
        status = "disabled"
    elif settings.llm_provider == "mock":
        status = "mock_fallback"
    elif has_api_key:
        status = "ready"
    elif settings.use_mock_when_no_key:
        status = "mock_fallback"
    else:
        status = "mock_fallback"

    return LLMStatusResponse(
        provider=settings.llm_provider,
        model=settings.active_llm_model(),
        allow_llm=settings.allow_llm,
        has_api_key=has_api_key,
        use_mock_when_no_key=settings.use_mock_when_no_key,
        status=status,
    )

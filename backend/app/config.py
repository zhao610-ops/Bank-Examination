from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """后端运行配置。"""

    app_name: str = "银行笔试 AI 刷题平台 API"
    app_env: str = "development"
    database_url: str = "sqlite:///./bank_exam.db"
    frontend_origin: str = "http://localhost:3000"
    frontend_origins: str = "http://localhost:3000"
    llm_provider: Literal["deepseek", "openai", "mock"] = "deepseek"
    llm_model: str = "deepseek-chat"
    deepseek_api_key: str | None = None
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    openai_api_key: str | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    allow_llm: bool = True
    use_mock_when_no_key: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_frontend_origins(self) -> list[str]:
        origins = self.frontend_origins or self.frontend_origin
        return [origin.strip() for origin in origins.split(",") if origin.strip()]

    def active_llm_model(self) -> str:
        if self.llm_provider == "mock" or not self.allow_llm:
            return "mock"
        if self.llm_provider == "openai":
            return self.openai_model
        return self.llm_model or self.deepseek_model

    def active_api_key(self) -> str | None:
        if self.llm_provider == "openai":
            return self.openai_api_key
        if self.llm_provider == "deepseek":
            return self.deepseek_api_key
        return None

    @staticmethod
    def mask_api_key(api_key: str | None) -> str:
        if not api_key:
            return ""
        if len(api_key) <= 8:
            return "****"
        return f"{api_key[:4]}****{api_key[-4:]}"


@lru_cache
def get_settings() -> Settings:
    return Settings()

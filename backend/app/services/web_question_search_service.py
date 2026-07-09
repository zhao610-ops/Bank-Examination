from dataclasses import dataclass

from app.schemas import WebQuestionCandidate, WebQuestionSearchRequest


@dataclass
class WebQuestionSearchResult:
    keywords: list[str]
    candidates: list[WebQuestionCandidate]


class WebQuestionSearchService:
    def build_keywords(self, request: WebQuestionSearchRequest) -> list[str]:
        year = str(request.exam_year) if request.exam_year else ""
        position = request.position_type or ""
        return [
            " ".join(part for part in [request.bank_name, "笔试", "真题", year] if part),
            " ".join(part for part in [request.bank_name, "秋招", "笔试", "真题", position] if part),
            " ".join(part for part in ["银行秋招", "EPI", "真题", request.category] if part),
            " ".join(part for part in [request.bank_name, "校招", "笔试", "题目", "回忆版"] if part),
        ]

    async def search(self, request: WebQuestionSearchRequest) -> WebQuestionSearchResult:
        keywords = self.build_keywords(request)
        candidates = self._mock_candidates(request)[: request.max_results]
        return WebQuestionSearchResult(keywords=keywords, candidates=candidates)

    def _mock_candidates(self, request: WebQuestionSearchRequest) -> list[WebQuestionCandidate]:
        # 没有搜索 API 时只能返回 mock 候选题，不能伪装成正式真题。
        source_url = "https://example.com/mock-bank-exam-memory"
        return [
            WebQuestionCandidate(
                question_text=f"【mock候选】网友回忆称，{request.bank_name}{request.exam_year or ''}笔试曾出现一题：资料表中某业务量同比变化率如何计算？",
                options={
                    "A": "本期量÷上期量",
                    "B": "（本期量-上期量）÷上期量",
                    "C": "上期量÷本期量",
                    "D": "（上期量-本期量）÷本期量",
                },
                correct_answer="B",
                explanation="同比变化率通常用（本期量-上期量）÷上期量计算。该题仅为检索流程 mock 候选，需人工核验来源。",
                category=request.category,
                difficulty="medium",
                knowledge_point="增长率计算",
                bank_name=request.bank_name,
                exam_year=request.exam_year,
                source_url=source_url,
                source_title="mock：公开网页检索候选来源",
                confidence_score=0.62,
                is_complete=True,
            ),
            WebQuestionCandidate(
                question_text=f"【mock候选】{request.bank_name}笔试回忆版提到一道不完整题，缺少完整选项。",
                options={"A": "材料不足", "B": "", "C": "", "D": ""},
                correct_answer=None,
                explanation="该候选缺少完整选项和答案，不应直接入库。",
                category=request.category,
                difficulty="medium",
                knowledge_point="待补全",
                bank_name=request.bank_name,
                exam_year=request.exam_year,
                source_url=source_url,
                source_title="mock：不完整候选来源",
                confidence_score=0.35,
                is_complete=False,
                import_error="题干、选项或答案不完整",
            ),
        ]

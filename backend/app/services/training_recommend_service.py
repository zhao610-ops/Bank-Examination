from datetime import date
from typing import Any

from app.models import UserStat
from app.schemas import Difficulty, TrainingRecommendRequest


def calculate_remaining_days(exam_date: date) -> int:
    """计算距离考试的剩余天数。"""

    return max((exam_date - date.today()).days, 0)


def get_stage_by_remaining_days(remaining_days: int) -> tuple[str, Difficulty]:
    """按剩余天数确定备考阶段和主难度。"""

    if remaining_days > 60:
        return "基础建立期", "easy"
    if remaining_days > 30:
        return "专项强化期", "medium"
    if remaining_days > 15:
        return "冲刺提升期", "medium"
    if remaining_days > 7:
        return "考前复盘期", "medium"
    return "考前稳定期", "medium"


def get_base_question_count_by_minutes(daily_minutes: int) -> int:
    """按每日可用时间给出稳定基础题量。"""

    if daily_minutes <= 15:
        return 7
    if daily_minutes <= 30:
        return 15
    if daily_minutes <= 60:
        return 28
    return 45


def adjust_count_by_remaining_days(base_count: int, remaining_days: int, exam_type: str) -> int:
    """按临考程度和考试类型微调总题量。"""

    count = base_count
    if remaining_days > 60:
        count = round(count * 0.95)
    elif remaining_days > 30:
        count = round(count * 1.05)
    elif remaining_days > 15:
        count = round(count * 1.12)
    elif remaining_days > 7:
        count = round(count * 0.96)
    else:
        count = round(count * 0.82)

    if exam_type == "春招":
        count = round(count * 1.08)
    elif exam_type == "实习招聘":
        count = round(count * 0.85)
    elif exam_type == "社招":
        count = round(count * 0.95)

    return max(count, 5)


def _job_templates(job_type: str) -> list[dict[str, Any]]:
    templates = {
        "金融科技岗": [
            {"category": "EPI / 行测", "sub_category": "资料分析", "weight": 0.20, "reason": "资料分析是银行笔试高频模块，也能训练数据处理速度。"},
            {"category": "金融科技岗", "sub_category": "数据库 SQL", "weight": 0.20, "reason": "金融科技岗需要重点掌握数据库基础和查询能力。"},
            {"category": "金融科技岗", "sub_category": "计算机网络", "weight": 0.15, "reason": "计算机网络是金融科技岗常见基础考点。"},
            {"category": "金融科技岗", "sub_category": "数据结构算法", "weight": 0.12, "reason": "算法基础能覆盖编程与技术笔试核心能力。"},
            {"category": "综合知识", "sub_category": "金融知识", "weight": 0.18, "reason": "银行科技岗仍需理解金融业务基础。"},
            {"category": "英语能力", "sub_category": "阅读理解", "weight": 0.10, "reason": "保持英语阅读手感，避免长期断练。"},
            {"category": "错题复盘", "sub_category": "错题回顾", "weight": 0.05, "reason": "保留少量复盘时间，巩固近期薄弱点。"},
        ],
        "综合岗": [
            {"category": "EPI / 行测", "sub_category": "资料分析", "weight": 0.25, "reason": "资料分析是综合岗笔试高频模块，提分收益较高。"},
            {"category": "EPI / 行测", "sub_category": "判断推理", "weight": 0.20, "reason": "判断推理考察逻辑能力，是秋招常见模块。"},
            {"category": "综合知识", "sub_category": "金融知识", "weight": 0.20, "reason": "金融知识是银行综合岗基础考查重点。"},
            {"category": "综合知识", "sub_category": "银行常识", "weight": 0.10, "reason": "银行常识有助于补齐业务理解。"},
            {"category": "英语能力", "sub_category": "阅读理解", "weight": 0.15, "reason": "英语阅读保持稳定训练即可。"},
            {"category": "错题复盘", "sub_category": "错题回顾", "weight": 0.10, "reason": "复盘错题能提升综合训练效率。"},
        ],
        "客户经理岗": [
            {"category": "综合知识", "sub_category": "金融知识", "weight": 0.25, "reason": "客户经理岗需要扎实理解金融产品和银行业务。"},
            {"category": "综合知识", "sub_category": "市场营销", "weight": 0.18, "reason": "市场营销贴近客户经理岗位场景。"},
            {"category": "专业知识", "sub_category": "客户经理岗", "weight": 0.17, "reason": "岗位专项能提升业务场景判断能力。"},
            {"category": "EPI / 行测", "sub_category": "判断推理", "weight": 0.25, "reason": "判断推理用于保持通用笔试能力。"},
            {"category": "英语能力", "sub_category": "阅读理解", "weight": 0.10, "reason": "保持英语基础题训练。"},
            {"category": "错题复盘", "sub_category": "错题回顾", "weight": 0.05, "reason": "少量复盘用于修正常见失分点。"},
        ],
        "风控岗": [
            {"category": "综合知识", "sub_category": "金融知识", "weight": 0.22, "reason": "风控岗需要掌握金融业务和风险基础。"},
            {"category": "综合知识", "sub_category": "法律基础", "weight": 0.18, "reason": "法律基础与合规、风控场景高度相关。"},
            {"category": "专业知识", "sub_category": "风控岗", "weight": 0.20, "reason": "岗位专项用于强化风险识别能力。"},
            {"category": "EPI / 行测", "sub_category": "资料分析", "weight": 0.25, "reason": "资料分析能训练数据判断和计算能力。"},
            {"category": "英语能力", "sub_category": "阅读理解", "weight": 0.05, "reason": "保留少量英语训练。"},
            {"category": "错题复盘", "sub_category": "错题回顾", "weight": 0.10, "reason": "复盘错题能降低重复失误。"},
        ],
    }
    return templates.get(
        job_type,
        [
            {"category": "EPI / 行测", "sub_category": "资料分析", "weight": 0.22, "reason": "资料分析是银行笔试通用高频模块。"},
            {"category": "EPI / 行测", "sub_category": "判断推理", "weight": 0.18, "reason": "判断推理覆盖通用逻辑能力。"},
            {"category": "综合知识", "sub_category": "金融知识", "weight": 0.25, "reason": "金融知识是银行招聘基础模块。"},
            {"category": "英语能力", "sub_category": "阅读理解", "weight": 0.15, "reason": "英语阅读保持稳定训练。"},
            {"category": "专业知识", "sub_category": "管培生岗", "weight": 0.10, "reason": "岗位专项用于补齐目标岗位能力。"},
            {"category": "错题复盘", "sub_category": "错题回顾", "weight": 0.10, "reason": "复盘错题能提升训练转化率。"},
        ],
    )


def _adjust_templates_by_context(
    templates: list[dict[str, Any]],
    exam_type: str,
    remaining_days: int,
) -> list[dict[str, Any]]:
    adjusted = [item.copy() for item in templates]
    for item in adjusted:
        if exam_type == "社招" and item["category"] in {"专业知识", "金融科技岗"}:
            item["weight"] *= 1.25
        if exam_type == "实习招聘" and item["category"] == "英语能力":
            item["weight"] *= 0.9
        if exam_type == "春招" and item["category"] == "错题复盘":
            item["weight"] *= 1.35
        if remaining_days <= 30 and item["category"] == "错题复盘":
            item["weight"] *= 1.6
        if remaining_days <= 7 and item["category"] in {"金融科技岗", "专业知识"}:
            item["weight"] *= 0.75
        if remaining_days <= 7 and item["category"] == "错题复盘":
            item["weight"] *= 2.2
    return adjusted


def _difficulty_for_task(main_difficulty: Difficulty, remaining_days: int, accuracy: float | None) -> Difficulty:
    if accuracy is not None and accuracy < 60:
        return "easy" if remaining_days > 30 else "medium"
    if accuracy is not None and accuracy > 85 and remaining_days > 15:
        return "hard"
    if remaining_days <= 7:
        return "medium"
    if remaining_days <= 30 and main_difficulty == "medium":
        return "hard"
    return main_difficulty


def build_task_distribution(
    payload: TrainingRecommendRequest,
    total_question_count: int,
    remaining_days: int,
    main_difficulty: Difficulty,
    user_stats: list[UserStat],
) -> list[dict[str, Any]]:
    """按岗位比例、考试类型、临考阶段和薄弱点分配题量。"""

    accuracy_map = {f"{item.category} / {item.sub_category}": item.accuracy for item in user_stats}
    templates = _adjust_templates_by_context(_job_templates(payload.job_type), payload.exam_type, remaining_days)
    for item in templates:
        accuracy = accuracy_map.get(f"{item['category']} / {item['sub_category']}")
        if accuracy is not None and accuracy < 60:
            item["weight"] *= 1.35
        elif accuracy is not None and accuracy > 85:
            item["weight"] *= 0.75

    total_weight = sum(item["weight"] for item in templates) or 1
    counts = [max(1, round(total_question_count * item["weight"] / total_weight)) for item in templates]
    diff = total_question_count - sum(counts)
    index = 0
    while diff != 0 and counts:
        position = index % len(counts)
        if diff > 0:
            counts[position] += 1
            diff -= 1
        elif counts[position] > 1:
            counts[position] -= 1
            diff += 1
        index += 1

    tasks: list[dict[str, Any]] = []
    for item, count in zip(templates, counts, strict=True):
        accuracy = accuracy_map.get(f"{item['category']} / {item['sub_category']}")
        reason = item["reason"]
        if accuracy is not None and accuracy < 60:
            reason = f"当前正确率 {accuracy:.0f}% 偏低，优先补基础。"
        elif accuracy is not None and 60 <= accuracy <= 75:
            reason = f"当前正确率 {accuracy:.0f}%，保持中等难度训练。"
        elif accuracy is not None and accuracy > 85:
            reason = f"当前正确率 {accuracy:.0f}% 较高，减少基础题并加入提升题。"
        tasks.append(
            {
                "category": item["category"],
                "sub_category": item["sub_category"],
                "difficulty": _difficulty_for_task(main_difficulty, remaining_days, accuracy),
                "question_count": count,
                "reason": reason,
            }
        )
    return [task for task in tasks if task["question_count"] > 0]


def adjust_by_user_stats(tasks: list[dict[str, Any]], user_stats: list[UserStat]) -> list[dict[str, Any]]:
    """保留独立函数入口，便于后续扩展更细的薄弱点策略。"""

    if user_stats:
        return tasks
    return [
        {
            **task,
            "reason": f"{task['reason']} 当前暂无历史数据，系统按目标考试和岗位生成基础训练方案。",
        }
        for task in tasks
    ]


def _build_suggestions(remaining_days: int, has_stats: bool) -> list[str]:
    suggestions = ["建议先完成高频模块，再进入岗位专项。", "每 3 天复盘一次错题。"]
    if remaining_days <= 7:
        suggestions.append("考前 7 天减少新难题，优先复盘错题和高频知识点。")
    elif remaining_days <= 15:
        suggestions.append("考前 14 天开始加入模拟训练和限时练习。")
    else:
        suggestions.append("保持每日稳定训练，比单日大量刷题更重要。")
    if not has_stats:
        suggestions.append("当前暂无历史数据，完成一组训练后推荐会更贴合薄弱点。")
    return suggestions


def build_training_recommendation(
    payload: TrainingRecommendRequest,
    user_stats: list[UserStat],
) -> dict[str, Any]:
    remaining_days = calculate_remaining_days(payload.exam_date)
    stage, main_difficulty = get_stage_by_remaining_days(remaining_days)
    base_count = get_base_question_count_by_minutes(payload.daily_minutes)
    total_count = adjust_count_by_remaining_days(base_count, remaining_days, payload.exam_type)
    tasks = build_task_distribution(payload, total_count, remaining_days, main_difficulty, user_stats)
    tasks = adjust_by_user_stats(tasks, user_stats)
    return {
        "remaining_days": remaining_days,
        "current_stage": stage,
        "difficulty": main_difficulty,
        "total_question_count": sum(task["question_count"] for task in tasks),
        "estimated_minutes": payload.daily_minutes,
        "tasks": tasks,
        "suggestions": _build_suggestions(remaining_days, bool(user_stats)),
    }

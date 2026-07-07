from datetime import date


def calculate_remaining_days(exam_date: date) -> int:
    """计算考试日距今天的自然日数。"""

    return max((exam_date - date.today()).days, 0)


def get_current_stage(remaining_days: int) -> str:
    """根据剩余时间确定当前备考阶段。"""

    if remaining_days > 60:
        return "基础建立期"
    if remaining_days > 30:
        return "专项强化期"
    if remaining_days > 15:
        return "冲刺提升期"
    return "考前复盘期"


def build_phase_plan(remaining_days: int) -> list[dict[str, str]]:
    """生成用于展示的阶段计划。"""

    if remaining_days > 60:
        names = ["基础建立期", "专项强化期", "模拟冲刺期", "考前复盘期"]
    elif remaining_days > 30:
        names = ["高频模块强化", "错题专项突破", "模拟考试冲刺"]
    elif remaining_days > 15:
        names = ["核心高频题训练", "薄弱点突破", "考前模拟与复盘"]
    else:
        names = ["高频题速刷", "错题复盘", "模拟考试", "考前记忆"]
    return [{"name": name} for name in names]


def build_daily_tasks(
    exam_type: str,
    bank_type: str,
    target_bank: str,
    job_type: str,
    remaining_days: int,
    weak_points: list[str] | None = None,
) -> list[dict[str, str | int]]:
    """按岗位、临考程度和薄弱项生成今日任务。"""

    del exam_type, bank_type, target_bank
    task_map = {
        "金融科技岗": [
            ("EPI / 行测", "资料分析", 5),
            ("EPI / 行测", "判断推理", 5),
            ("金融科技岗", "数据库 SQL", 3),
            ("金融科技岗", "计算机网络", 3),
            ("综合知识", "金融知识", 3),
        ],
        "客户经理岗": [
            ("综合知识", "金融知识", 5),
            ("综合知识", "市场营销", 5),
            ("EPI / 行测", "判断推理", 5),
            ("专业知识", "客户经理岗", 3),
        ],
        "风控岗": [
            ("综合知识", "金融知识", 5),
            ("综合知识", "法律基础", 5),
            ("EPI / 行测", "资料分析", 5),
            ("专业知识", "风控岗", 3),
        ],
    }
    default_tasks = [
        ("EPI / 行测", "资料分析", 5),
        ("EPI / 行测", "判断推理", 5),
        ("综合知识", "金融知识", 5),
        ("英语能力", "阅读理解", 1),
    ]
    source = task_map.get(job_type, default_tasks)

    if remaining_days <= 7:
        source = [
            ("错题复盘", "错题回顾", 3),
            ("综合知识", "金融知识", 5),
            ("EPI / 行测", "资料分析", 3),
            ("综合知识", "考前记忆", 3),
        ]
    elif remaining_days <= 15:
        source = [(category, sub_category, max(1, count - 2)) for category, sub_category, count in source]
        source.extend([("错题复盘", "错题回顾", 3), ("模拟考试", "高频题", 3)])

    weak_set = set(weak_points or [])
    tasks = []
    for category, sub_category, count in source:
        is_weak = f"{category} / {sub_category}" in weak_set
        tasks.append(
            {
                "category": category,
                "sub_category": sub_category,
                "target_count": count + int(is_weak) * 2,
                "reason": "当前薄弱模块，增加专项训练" if is_weak else f"{job_type}当前阶段推荐任务",
            }
        )
    return tasks

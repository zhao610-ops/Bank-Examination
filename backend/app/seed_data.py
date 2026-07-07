from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Bank, QuestionCategory


BANKS = {
    "国有六大行": ["工商银行", "农业银行", "中国银行", "建设银行", "交通银行", "邮储银行"],
    "股份制银行": ["招商银行", "浦发银行", "中信银行", "民生银行", "平安银行", "广发银行"],
    "城商行": ["广州银行", "北京银行", "上海银行", "宁波银行", "江苏银行", "南京银行"],
    "农商行": ["广州农商银行", "深圳农商银行", "顺德农商银行"],
    "政策性银行": ["国家开发银行", "中国进出口银行", "中国农业发展银行"],
    "银行子公司": ["理财子公司", "金融科技子公司", "消费金融公司", "信用卡中心"],
}

CATEGORIES = {
    "EPI / 行测": ["言语理解", "数字运算", "资料分析", "判断推理", "图形推理"],
    "综合知识": ["金融知识", "经济知识", "会计基础", "法律基础", "管理学", "市场营销", "公共基础", "时政热点"],
    "英语能力": ["阅读理解", "完形填空", "词汇语法", "商务英语"],
    "专业知识": ["金融岗", "风控岗", "客户经理岗", "运营柜员岗", "管培生岗"],
    "金融科技岗": ["编程基础", "数据库 SQL", "计算机网络", "操作系统", "数据结构算法", "软件工程", "信息安全"],
    "写作 / 申论": ["金融热点短文", "材料分析", "银行业务建议", "半结构化表达题"],
    "性格测试": ["职业稳定性", "服务意识", "团队合作", "抗压能力", "合规意识"],
}


def seed_database(db: Session) -> None:
    """仅在空表中写入基础银行与分类数据。"""

    if db.scalar(select(func.count(Bank.id))) == 0:
        for bank_type, names in BANKS.items():
            for name in names:
                db.add(Bank(bank_type=bank_type, bank_name=name, region="全国", features=""))

    if db.scalar(select(func.count(QuestionCategory.id))) == 0:
        for category, children in CATEGORIES.items():
            parent = QuestionCategory(name=category, level=1)
            db.add(parent)
            db.flush()
            for child in children:
                db.add(QuestionCategory(parent_id=parent.id, name=child, level=2))

    db.commit()


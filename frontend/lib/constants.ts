import type { Difficulty, SourceType, VerificationStatus, TrainingSourceMode } from "@/types";
import type { BankGroup, Category } from "@/types";


export const EXAM_TYPES = ["秋招", "春招", "实习招聘", "社招"];
export const JOB_TYPES = ["综合岗", "柜员岗", "客户经理岗", "金融科技岗", "风控岗", "管培生"];
export const QUESTION_COUNTS = [5, 10, 20];
export const DAILY_MINUTES_OPTIONS = [15, 30, 60, 90];
export const TRAINING_SOURCE_MODES: { value: TrainingSourceMode; label: string }[] = [
  { value: "normal", label: "普通训练" },
  { value: "real_only", label: "只练真题" },
  { value: "web_retrieved", label: "AI检索题" }
];
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  ai_generated: "AI生成",
  web_retrieved: "AI检索",
  verified_real_exam: "已核验真题",
  mock_exam: "模拟题",
  imported: "导入题",
  manual: "手动录入"
};
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  unverified: "待核验",
  verified: "已核验",
  rejected: "已驳回"
};
export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "基础" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "冲刺" }
];

export const TRAINING_STORAGE_KEY = "bank-exam-training-config";
export const SMART_TRAINING_STORAGE_KEY = "bank-exam-smart-training-plan";
export const WRONG_REVIEW_STORAGE_KEY = "bank-exam-wrong-review";

export const FALLBACK_BANKS: BankGroup[] = [
  { bank_type: "国有六大行", banks: ["工商银行", "农业银行", "中国银行", "建设银行", "交通银行", "邮储银行"].map((bank_name, index) => ({ id: index + 1, bank_type: "国有六大行", bank_name, region: "全国", features: "" })) },
  { bank_type: "股份制银行", banks: ["招商银行", "浦发银行", "中信银行", "民生银行", "平安银行", "广发银行"].map((bank_name, index) => ({ id: index + 10, bank_type: "股份制银行", bank_name, region: "全国", features: "" })) },
  { bank_type: "城商行", banks: ["广州银行", "北京银行", "上海银行", "宁波银行", "江苏银行", "南京银行"].map((bank_name, index) => ({ id: index + 20, bank_type: "城商行", bank_name, region: "全国", features: "" })) },
  { bank_type: "农商行", banks: ["广州农商银行", "深圳农商银行", "顺德农商银行"].map((bank_name, index) => ({ id: index + 30, bank_type: "农商行", bank_name, region: "全国", features: "" })) },
  { bank_type: "政策性银行", banks: ["国家开发银行", "中国进出口银行", "中国农业发展银行"].map((bank_name, index) => ({ id: index + 40, bank_type: "政策性银行", bank_name, region: "全国", features: "" })) },
  { bank_type: "银行子公司", banks: ["理财子公司", "金融科技子公司", "消费金融公司", "信用卡中心"].map((bank_name, index) => ({ id: index + 50, bank_type: "银行子公司", bank_name, region: "全国", features: "" })) }
];

export const FALLBACK_CATEGORIES: Category[] = [
  { name: "EPI / 行测", children: ["言语理解", "数字运算", "资料分析", "判断推理", "图形推理"] },
  { name: "综合知识", children: ["金融知识", "经济知识", "会计基础", "法律基础", "管理学", "市场营销", "公共基础", "时政热点"] },
  { name: "英语能力", children: ["阅读理解", "完形填空", "词汇语法", "商务英语"] },
  { name: "专业知识", children: ["金融岗", "风控岗", "客户经理岗", "运营柜员岗", "管培生岗"] },
  { name: "金融科技岗", children: ["编程基础", "数据库 SQL", "计算机网络", "操作系统", "数据结构算法", "软件工程", "信息安全"] },
  { name: "写作 / 申论", children: ["金融热点短文", "材料分析", "银行业务建议", "半结构化表达题"] },
  { name: "性格测试", children: ["职业稳定性", "服务意识", "团队合作", "抗压能力", "合规意识"] }
];

# 银行笔试 AI 刷题平台

基于 Next.js、FastAPI、SQLite 和统一模型 API 接入层的银行招聘笔试训练 MVP。

## 已实现功能

- 银行类型、目标银行、岗位、模块、难度和题量配置
- DeepSeek / OpenAI / 本地 mock 出题；未配置密钥时可自动使用本地模拟题
- 选择题答题、自动批改和答案解析
- 错题本、模块筛选和错题复练
- 总正确率、模块正确率、薄弱点和训练建议
- 考试倒计时、阶段计划、每日训练任务和完成进度
- 答题计时和训练完成总结

## 备考计划

访问 `/plan`，设置考试类型、目标银行、岗位和考试日期。系统根据剩余天数、岗位类型及当前薄弱模块生成阶段计划和今日任务；计划规则完全在本地运行，不依赖大模型。

后端接口：

- `POST /api/exam-plan/create`：创建或更新当前计划
- `GET /api/exam-plan/current`：获取当前计划
- `GET /api/exam-plan/today`：获取或生成今日任务
- `GET /api/exam-plan/progress`：按每日任务完成量计算进度

## 环境要求

- Node.js 20 或更高版本
- Python 3.11 或更高版本

## 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

模型 API Key 只允许配置在后端 `backend/.env`，不要写入前端环境变量，也不要提交 `.env`。`.env.example` 只能保留占位符。

使用 DeepSeek：

```env
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-chat
DEEPSEEK_API_KEY=sk-xxx
ALLOW_LLM=true
USE_MOCK_WHEN_NO_KEY=true
```

切换 OpenAI：

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
ALLOW_LLM=true
```

强制使用本地 mock：

```env
LLM_PROVIDER=mock
ALLOW_LLM=false
```

密钥留空且 `USE_MOCK_WHEN_NO_KEY=true` 时使用本地模拟题，不影响完整流程。启动后可访问 `http://localhost:8000/api/llm/status` 检查当前模型状态，接口不会返回 API Key。

SQLite 开发库如果是旧表，启动时会尝试自动补充新增列；如仍遇到缺列错误，可在开发环境删除旧的 `backend/bank_exam.db` 后重新启动，或手动执行对应 `ALTER TABLE` 迁移。

```powershell
uvicorn app.main:app --reload --port 8000
```

接口文档：http://localhost:8000/docs

## 启动前端

```powershell
cd frontend
npm install
npm run dev
```

访问：http://localhost:3000

前端通过 `NEXT_PUBLIC_API_BASE_URL` 配置后端地址，未配置时使用 `http://localhost:8000`，不保存模型密钥。可复制 `.env.local.example` 为 `.env.local`。

## 测试与构建

```powershell
cd backend
.\.venv\Scripts\python -m pytest

cd ..\frontend
npm run typecheck
npm run build
```

## 项目结构

```text
backend/   FastAPI 接口、SQLite 模型、DeepSeek 服务和测试
frontend/  Next.js 页面、业务组件、通用 UI 和接口类型
```

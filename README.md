# 银行笔试 AI 刷题平台

基于 Next.js、FastAPI、SQLite 和 DeepSeek API 的银行招聘笔试训练 MVP。

## 已实现功能

- 银行类型、目标银行、岗位、模块、难度和题量配置
- DeepSeek AI 出题；未配置密钥时自动使用本地模拟题
- 选择题答题、自动批改和答案解析
- 错题本及模块筛选
- 总正确率、模块正确率、薄弱点和训练建议

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

如需使用 DeepSeek，在 `backend/.env` 中填写：

```env
DEEPSEEK_API_KEY=你的密钥
```

密钥留空时使用本地模拟题，不影响完整流程。

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

前端开发环境固定请求 `http://localhost:8000`，不保存模型密钥。

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


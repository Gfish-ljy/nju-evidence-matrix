# EvidenceMatrix

基于大模型的科研方向动态检索与分析系统 —— 南京大学大学生创新训练计划项目。

## 当前状态

MVP v0：数据与接口契约、mock 数据已就绪。解析、抽取、后端、UI 可以并行开发。

## 目录

```
docs/
  统一接口与文档说明_v0.1.md   契约总纲：统一约定、对象、枚举、UI 数据需求
  schema_v0.json               字段权威定义（机器可读）
  api_contract_v0.md           接口权威定义（路由、参数、响应、错误）
mock/                          5 篇论文的完整假数据（虚构，仅用于开发）
web/                           EvidenceMatrix 前端原型（React + TypeScript + Vite）
```

## 快速开始

前端：

```bash
cd web
npm install
npm run dev
```

打开 Vite 输出的地址（默认 http://127.0.0.1:5173）。前端说明见 `web/README.md`。

契约：

1. 先读 `docs/统一接口与文档说明_v0.1.md`。
2. 字段以 `docs/schema_v0.json` 为准，接口以 `docs/api_contract_v0.md` 为准。
3. UI 演示数据在 `web/src/data/demo.ts`（20 篇虚构论文）；`mock/` 是契约样例数据。
4. 校验 mock：进入 `mock/` 目录，按 `mock/README.md` 中的脚本运行（需要 `jsonschema`）。

## 团队分工

| 成员 | 主责 |
|---|---|
| A 李金怡 | 项目统筹、三层次 UI、知识状态与更新流程 |
| B 吴梓进 | 数据管线、GROBID 接口、图数据 API、系统集成 |
| C 张航瑞 | 论文检索筛选、数据质量、标注组织、背景调查 |
| D 邓鸿瑞 | LLM 抽取、Claim 对齐与关系识别、聚类 |

## 约定

- 先契约后开发；字段/接口变更先改 schema 或 API 契约，再同步总纲并通知全员。
- `mock/` 中的论文、作者、结论均为虚构，不得作为真实文献引用。
- 统一 ID：`paper_id / claim_id / condition_id / evidence_id / relation_id / cluster_id / update_id`，永不复用。

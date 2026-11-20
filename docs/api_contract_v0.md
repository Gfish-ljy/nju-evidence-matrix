# EvidenceMatrix API 契约 v0.1

> Owner：B（吴梓进）  
> 状态：讨论稿，随《统一接口与文档说明 v0.1》冻结  
> 数据定义：以 `schema_v0.json` 为准；本文件定义路由、参数、响应与错误  
> 适用：Agent Memory MVP（50 篇论文）

## 1. 基础约定

- Base URL：`/api/v0`
- Content-Type：`application/json; charset=utf-8`
- 所有时间：ISO 8601 UTC（`2026-11-20T10:00:00Z`）
- 所有响应使用统一壳：

```json
{"data": {}, "meta": {"page": 1, "size": 20, "total": 50}, "error": null}
```

- 分页：`page` 默认 1，`size` 默认 20、最大 100；列表必须返回 `meta.total`
- 排序：`sort=field:asc|desc`，默认按主键升序；空值排最后
- 过滤：多个参数为 AND；未知参数忽略
- 字段缺失：未知标量用 `null`，空数组用 `[]`，不省略字段
- 枚举：一律使用 `schema_v0.json` 中的英文值

## 2. 端点总表

| # | 方法 | 路径 | 用途 |
|---|---|---|---|
| 1 | GET | `/papers` | 论文列表 |
| 2 | GET | `/papers/{paper_id}` | 论文详情 |
| 3 | GET | `/claims` | Claim 列表 |
| 4 | GET | `/claims/{claim_id}` | Claim 详情（含 Condition） |
| 5 | GET | `/claims/{claim_id}/evidence` | 该 Claim 的证据 |
| 6 | GET | `/relations` | 关系查询 |
| 7 | GET | `/clusters` | 簇列表 |
| 8 | GET | `/graph` | 图数据（paper / claim / cluster） |
| 9 | GET | `/matrix` | 证据矩阵 |
| 10 | GET | `/knowledge-states` | 知识状态历史 |
| 11 | GET | `/updates` | 更新日志 |
| 12 | POST | `/review/claims/{claim_id}` | 人工校验回写 |

## 3. 端点详情

### 3.1 GET /papers

参数：

| 参数 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| query | string | 否 | — | 标题/摘要模糊匹配 |
| year | int | 否 | — | 年份 |
| venue | string | 否 | — | 会议/期刊 |
| selected | bool | 否 | — | 是否精选 |
| page / size | int | 否 | 1 / 20 | 分页 |
| sort | string | 否 | paper_id:asc | 排序 |

响应 `data` 为 Paper 数组：

```json
{"data": [{"paper_id": "P0001", "title": "Memory Mechanisms for LLM Agents: A Survey", "authors": ["Mock Author A"], "year": 2023, "venue": "arXiv", "doi": null, "url": "https://arxiv.org/abs/2301.00001", "pdf_path": "pdfs/P0001.pdf", "citation_count": 120, "quality_score": 0.82, "is_selected": true, "selection_reason": "survey"}],
 "meta": {"page": 1, "size": 20, "total": 1}, "error": null}
```

### 3.2 GET /papers/{paper_id}

- 200：`data` 为 Paper
- 404：`NOT_FOUND`

### 3.3 GET /claims

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| paper_id | string | 否 | 按论文过滤 |
| cluster_id | string | 否 | 按簇过滤 |
| state | string | 否 | KnowledgeState 枚举 |
| page / size | int | 否 | 分页 |
| sort | string | 否 | 默认 claim_id:asc |

`data` 为 Claim 数组。

### 3.4 GET /claims/{claim_id}

`data` 为：

```json
{"claim": {"claim_id": "C0001", "...": "..."},
 "condition": {"condition_id": "CD0001", "...": "..."}}
```

`condition` 可为 `null`。

### 3.5 GET /claims/{claim_id}/evidence

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| stance | string | 否 | Support / Contrast / Background / Method |
| page / size | int | 否 | 分页 |

`data` 为 Evidence 数组，按 `page` 升序。

### 3.6 GET /relations

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| source_claim_id | string | 否 | 源 Claim |
| target_claim_id | string | 否 | 目标 Claim |
| type | string | 否 | 六类关系之一 |
| page / size | int | 否 | 分页 |

`data` 为 Relation 数组。

### 3.7 GET /clusters

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| level | string | 否 | problem / task / method |

`data` 为 Cluster 数组；`status_distribution` 的键使用 KnowledgeState 枚举。

### 3.8 GET /graph

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| level | string | 是 | paper / claim / cluster |
| time_window | string | 否 | `2022-2026` |
| state | string | 否 | 过滤节点状态 |
| relation_type | string | 否 | 过滤边类型 |

响应：

```json
{"data": {
  "nodes": [
    {"id": "K01", "type": "cluster", "label": "Memory retrieval", "state": "Contested", "size": 5, "position": [0, 0, 0]},
    {"id": "C0005", "type": "claim", "label": "Retrieval outperforms full-context prompting", "state": "Supported", "size": 2, "paper_id": "P0002", "year": 2024, "evidence_count": 1, "position": [1, 0, 0]}
  ],
  "edges": [
    {"id": "R0001", "source": "C0005", "target": "C0002", "type": "Supports", "weight": 0.86, "condition_comparability": "Comparable"}
  ]
},
"meta": {}, "error": null}
```

说明：
- `position` 可缺省；缺省时由 UI 布局。
- `size` 在 cluster 层为 Claim 数，在 claim 层为证据数，在 paper 层为引用数。
- 边的 `source` / `target` 必须是本次返回的节点 ID。

### 3.9 GET /matrix

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| row | string | 是 | claim / cluster |
| col | string | 是 | method / dataset / condition / metric |
| cluster_id | string | 否 | 限定范围 |
| state | string | 否 | 过滤 |

响应：

```json
{"data": {
  "rows": [{"id": "C0005", "label": "Retrieval outperforms full-context"}],
  "cols": [{"id": "method:vector_retrieval", "label": "Vector retrieval"}],
  "cells": [{"row_id": "C0005", "col_id": "method:vector_retrieval", "counts": {"Supports": 2, "Contradicts": 1}, "state": "Supported", "evidence_count": 2}]
},
"meta": {}, "error": null}
```

### 3.10 GET /knowledge-states

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| claim_id | string | 是 | Claim |

`data` 为该 Claim 的状态版本数组，`version` 降序；无记录返回 `[]`。

### 3.11 GET /updates

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| claim_id | string | 否 | 按 Claim 过滤 |
| reviewed | bool | 否 | 是否已校验 |
| page / size | int | 否 | 分页 |

`data` 为 UpdateLog 数组，按 `timestamp` 降序。

### 3.12 POST /review/claims/{claim_id}

请求体：

```json
{"operator": "A", "review_status": "Accepted", "state": "Supported", "relation_id": "R0001", "relation_type": "Contradicts", "comment": "条件可比，确认冲突"}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| operator | string | 是 | 操作人 |
| review_status | string | 是 | Pending / Accepted / Rejected / Edited |
| state | string | 否 | 新 KnowledgeState；变更则写 UpdateLog |
| relation_id | string | 否 | 被校验的关系 |
| relation_type | string | 否 | 关系修正值 |
| comment | string | 否 | 审核说明 |

响应：

```json
{"data": {"claim": {"claim_id": "C0001", "...": "..."},
          "update": {"update_id": "U0006", "claim_id": "C0001", "from_state": "Contested", "to_state": "Supported", "delta_evidence_ids": ["E0001"], "reason": "人工校验", "operator": "A", "reviewed": true, "timestamp": "2026-11-20T12:00:00Z"}},
 "meta": {}, "error": null}
```

- 状态未变化时 `update` 为 `null`
- 只允许修改状态和关系类型，不允许改原文证据

## 4. 错误码

| HTTP | code | 场景 |
|---|---|---|
| 400 | INVALID_PARAM | 参数缺失/类型错误/枚举非法 |
| 404 | NOT_FOUND | 对象不存在 |
| 409 | CONFLICT | 并发更新或版本冲突 |
| 422 | UNSUPPORTED | 合法但 MVP 不支持（如未实现的矩阵维度） |
| 500 | INTERNAL | 未预期错误 |

```json
{"data": null, "meta": {}, "error": {"code": "INVALID_PARAM", "message": "level must be paper|claim|cluster", "details": {"param": "level"}}}
```

## 5. mock 与真实数据

- 静态 mock 服务直接返回 `mock/` 下的 JSON，响应形状与真实 API 一致。
- UI 通过配置切换 base URL；两条路径不得出现字段差异。
- mock 数据必须通过 `schema_v0.json` 校验后再提交。

## 6. B 的实现要求

1. `paper_edges.csv` 列固定为：`source_paper_id,target_paper_id,citation_context,section,stance,confidence`。
2. 所有 ID 跨批次稳定；重复解析不得生成新 ID。
3. 接口只返回契约字段，不附加内部调试字段。
4. 列表默认排序确定；同一请求重复调用结果一致。
5. 本地 mock 环境下，单接口 p95 响应 < 200ms。
6. MVP 不做鉴权；需开启本地开发 CORS。

## 7. 变更流程

1. 先改 `schema_v0.json`（字段）或本文件（接口）。
2. 同步更新《统一接口与文档说明 v0.1》。
3. 通知 A/C/D，评审通过后合并。
4. 破坏性变更升 `/api/v1`。

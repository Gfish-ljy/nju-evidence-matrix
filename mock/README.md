# Mock 数据 v0（Agent Memory）

> 用途：UI 开发、接口联调前的假数据；所有论文、作者、结论均为**虚构**，不代表真实研究。
> 契约：字段与枚举以 `../docs/schema_v0.json` 为准；接口形状以 `../api_contract_v0.md` 为准。

## 内容

| 文件 | 记录数 | 说明 |
|---|---|---|
| `paper_nodes.json` | 5 | 论文 P0001–P0005 |
| `paper_edges.csv` | 8 | 论文引用边 |
| `claims.json` | 20 | Claim C0001–C0020 |
| `conditions.json` | 20 | 每条 Claim 的实验条件 |
| `claim_edges.json` | 16 | 六类关系边 R0001–R0016 |
| `evidence.json` | 25 | 原文证据 E0001–E0025 |
| `clusters.json` | 5 | 问题簇 K01–K05 |
| `knowledge_states.json` | 20 | 每条 Claim 的当前状态 |
| `updates.json` | 5 | 状态更新日志 U0001–U0005 |

## 数据设计要点

- 5 篇论文分布在 5 个簇：检索、巩固、编辑/遗忘、长时记忆评测、记忆架构。
- 20 条 Claim 覆盖六种知识状态：Supported / Contested / Qualified / WeaklySupported / Superseded / Unresolved。
- 16 条关系覆盖六类关系：Supports / Contradicts / Extends / Refines / Qualifies / Supersedes；包含一条 `Incomparable` 的“表面冲突”（R0014），用于测试条件不可比提示。
- 所有 ID 可 join：Claim → Paper / Condition / Evidence / Cluster；Relation → Claim / Evidence；UpdateLog → Claim / Evidence。

## 校验

```bash
python - <<'EOF'
import json, glob
from jsonschema import Draft202012Validator, FormatChecker
schema = json.load(open("../docs/schema_v0.json", encoding="utf-8"))
files = {
  "paper_nodes.json": "Paper", "claims.json": "Claim", "conditions.json": "Condition",
  "claim_edges.json": "Relation", "evidence.json": "Evidence", "clusters.json": "Cluster",
  "knowledge_states.json": "KnowledgeState", "updates.json": "UpdateLog",
}
for f, t in files.items():
    sub = {"$schema": schema["$schema"], "$defs": schema["$defs"], "$ref": "#/$defs/" + t}
    v = Draft202012Validator(sub, format_checker=FormatChecker())
    data = json.load(open(f, encoding="utf-8"))
    for i, rec in enumerate(data):
        errs = list(v.iter_errors(rec))
        assert not errs, (f, i, errs[0].message)
print("mock OK")
EOF
```

## 使用方式

- UI 直接读取这些文件，或由 mock 服务按 `api_contract_v0.md` 返回。
- 替换成真实数据时保持文件形状、ID 规则和枚举不变；不要改字段名。

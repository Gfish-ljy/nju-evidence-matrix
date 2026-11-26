# Mock API 联调

在仓库根目录运行。只需 Python 3.11+，启动时读取现有 JSON/CSV。

```bash
python -m backend.mock_api --port 8000
```

前端 base URL 使用 `http://127.0.0.1:8000/api/v0`。开发 CORS 接受本机客户端。数据均为虚构，适合展示接口链路。

| 请求 | 演示内容 |
| --- | --- |
| `GET /api/v0/papers?selected=true` | 从精选论文开始浏览 |
| `GET /api/v0/graph?level=paper` | 论文引用图。节点大小使用引用数 |
| `GET /api/v0/graph?level=claim&relation_type=Contradicts` | 查看 Claim 关系、可比性和置信度 |
| `GET /api/v0/claims/C0010` | 查看 Claim 及 ALFWorld 实验条件 |
| `GET /api/v0/claims/C0010/evidence?stance=Contrast` | 查看来自另一篇论文的复现实验原文、章节和页码 |
| `GET /api/v0/papers/P0004` | 通过 Evidence 的 paper_id 回到出处 |
| `GET /api/v0/knowledge-states?claim_id=C0010`、`GET /api/v0/updates?claim_id=C0010` | 查看当前版本和更新记录 |

现有 mock 只有标题，搜索按标题做不区分大小写的子串匹配。论文图预览以 `Cites` 标记 CSV 引用边，边 ID 仅供该 mock 图展示。真实 TEI 数据、引用次数矩阵和引用上下文查询见 [GROBID TEI 离线接入](tei_handoff.md)。簇图聚合、证据矩阵和人工审核写入返回 `422 UNSUPPORTED`，待其业务规则评审。

```bash
python -m unittest discover -s tests -v
```

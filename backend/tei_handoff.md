# GROBID TEI 离线接入

科研矩阵表已有三类产物：TEI 是原始解析缓存，单篇 JSON 是旧工具的 Excel 导出数据源，Excel 是展示结果。EvidenceMatrix 从 TEI 恢复逐处引用及其原文段落，旧工具继续负责原有 Excel、人工标签和译文。导入不会调用 GROBID 或模型服务，也不会修改旧工具目录。

## 运行

在 EvidenceMatrix 仓库根目录执行，需 Python 3.11+。先将论文清单保存在 `.local/catalog.json`。下面是虚构示例，TEI 文件名要与实际缓存一致。

```json
[
  {"paper_id":"P0001","tei":"paper_a.tei.xml","is_selected":true},
  {"paper_id":"P0002","tei":"paper_b.tei.xml","year":2025}
]
```

```powershell
$teiCache = '<科研矩阵表项目中的 data/state/papers 绝对路径>'
python -m backend.import_tei --catalog .local/catalog.json --tei-dir $teiCache --output .local/tei-bundle
python -m backend.mock_api --bundle .local/tei-bundle --port 8000
```

论文清单是稳定 ID 的来源。追加论文时沿用已有 `paper_id`，给新论文分配新 ID。缺少刊发年份时，导入会提示在清单中补 `year`。可按核实后的元数据提供 `title`、`venue`、`doi`、`arxiv_id`、`citation_count`，`is_selected` 默认 true。输出目录必须是新路径，便于复跑或保留可比较的快照。`.local/` 不纳入 Git。

## 分工交接

| 使用方 | 消费的数据 | 对接约定 |
| --- | --- | --- |
| 论文筛选与质量校验（C） | 清单、`ingestion_report.json` | 管理论文 ID 和年份等元数据，核对无目标、未知目标和匹配冲突的引用 |
| Claim 抽取与对齐（D） | `paper_nodes.json`、`parsed_documents.json` | 沿用 `paper_id`。文档包含 `abstract` 和按 TEI 顺序排列的 `passages`，段落记录有 `passage_id`、`section`、`page`、`text`。Evidence.quote 从对应段落引用，页码缺失保留 null |
| UI 和系统联调（A、B） | 论文明细、论文图和下面的实验接口 | 每个矩阵单元格用 `source_paper_id + reference_id` 下钻，论文图的边 ID 可查看同一处引用 |

`paper_edges.csv` 继续使用 v0.1 的六列，只写匹配到库内论文的引用。TEI 不提供已经核实的立场或置信度，CSV 中对应值为空，论文图的 `weight` 为 null。引用上下文为带标记的 TEI 原文段落，空白经过归一化。页码只来自 TEI 坐标。旧工具的别名补齐、句级窗口、人工标签及译文目前不进入这个口径。

匹配依次使用 DOI/arXiv ID 和归一化标题。标题需在论文清单中唯一，两个已知年份相差超过一年或标识符冲突时不链接。库外条目按 DOI、arXiv ID 或相同标题与年份合并。信息不够的条目保留来源范围内的 ID。一个引用标记指向多篇文献时，每个目标各计一次。无目标及未知目标记入报告。段落和引用 ID 基于论文 ID、内容及同内容序号；同批复跑及调整清单顺序保持稳定，TEI 原文或定位变化后需重新核对对应关系。

现有 Claim API 可直接接收组员交付的 v0.1 JSON 数组。把本批抽取产物放进独立目录，用同一份论文清单的 `paper_id`。文件名沿用 `claims.json`、`conditions.json`、`evidence.json`、`claim_edges.json`、`clusters.json`、`knowledge_states.json`、`updates.json`。可以分阶段提供文件，已经出现的跨表引用必须闭合。服务启动时校验 Schema 和引用，失败会指出文件及记录。

```powershell
python -m pip install -r mock/requirements-validation.txt
python -m backend.mock_api --bundle .local/tei-bundle --analysis-dir .local/analysis --port 8000
```

## 前端联调

沿用 `/api/v0` 响应壳。下列新增只读路由放在 `experimental` 下，供联调评审。原有 `/matrix` 仍指 Claim 证据矩阵。真实运行加载本次导入的论文与引用，传入 `--analysis-dir` 后同一服务也提供 Claim、Condition 和 Evidence。

| GET 路由 | 返回 |
| --- | --- |
| `/api/v0/papers?query=…` | 从标题和已解析的摘要匹配论文 |
| `/api/v0/graph?level=paper` | 库内引用图，每条边对应一处引用 |
| `/api/v0/experimental/citation-matrix` | `rows` 为被引文献，`cols` 为论文，`cells` 为非空格子。可选 `source_paper_id` |
| `/api/v0/experimental/citations?source_paper_id=P0001&reference_id=…` | 按出处顺序列出该单元格中的引用，支持 `page` 和 `size`。总条数等于单元格计数 |
| `/api/v0/experimental/citations/{citation_id}` | 单条引用的原文段落、标记、章节、页码、关联的段落和论文 |

库外文献行的 `paper_id` 为 null。前端可以展示文献标题和原文段落；论文详情链接只用于存在 `paper_id` 的文献。API 默认仍使用 mock，须传入 `--bundle` 才切换数据。答辩时可一边展示真实论文的引用矩阵，一边用已有 mock 说明 Claim、Condition、Evidence 的交互链路。

```bash
python -m unittest discover -s tests -v
```

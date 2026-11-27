# 吴梓进（B）进度与联调说明

**我的任务是把论文解析结果接到 EvidenceMatrix**。上游是论文清单和 GROBID，输出是论文资料、带位置的正文和引用记录。前端可以用它做矩阵和关系图，抽取同学可以用它找研究主张和原文证据。我也负责把这些结果接回同一个服务，检查能否按 ID 对上。

| 我的工作 | 进度与验收 |
| --- | --- |
| GROBID 接口与数据管线 | 已用真实 TEI 缓存跑通离线导入。新 PDF 在线解析由旧科研矩阵表工具负责，本轮尚未验证线上服务可用。 |
| 图数据 API | 已实现论文引用图、Claim 关系图、引用矩阵和引用下钻。真实论文图可用。Claim 图已用 mock 验证，也可加载符合契约的组员产物。 |
| 系统集成 | 已提供真实数据模式和 mock 模式。真实论文包可加载匹配同一组 `paper_id` 的 Claim、Condition、Evidence 等数据，加载时校验 Schema 和跨表 ID。等首批真实抽取结果与前端一起验收。 |
| API 契约、mock、仓库检查 | 已提供 mock 校验、测试和 PR 检查配置。新增引用矩阵路由暂列 `experimental`。簇图、Claim 证据矩阵、审核写入仍需团队确定业务规则。 |

## 组员怎么接

GitHub 的 `web/` 已有使用演示数据的前端原型。现有 Evidence Matrix 页面展示的是主张及实验条件，引用矩阵是另外一项数据视图。第一轮可将引用矩阵与原文下钻接到独立界面或现有论文详情；前端接法经联调后确定。

| 成员 | 先给什么 | 可以拿什么继续 |
| --- | --- | --- |
| 张航瑞（C，筛选与标注） | 交同一批精选论文的目录清单，明确 `paper_id`、TEI 文件名和缺失年份 | 看 `ingestion_report.json`，核对没有目标或未匹配到库内的引用 |
| 邓鸿瑞（D，抽取与对齐） | 沿用清单中的 `paper_id`，先交一小批 Claim、Condition、Evidence（已用到的引用必须同时提供） | 从 `parsed_documents.json` 读原文段落、章节和可用页码。文件格式和加载命令见离线接入文档 |
| 李金怡（A，UI 与更新） | 用 mock 或本机 TEI 样例验收列表、矩阵和下钻 | 先做「点引用次数看原文」和「点论文图的边看引用」。拿到真实抽取数据后联调 Claim、证据和状态历史 |

第一轮联调只用一小批共用论文编号。验收时从矩阵点一格，核对引用数和原文，再从一个 Claim 追到该批论文的证据。接口字段、启动命令和实验路由见 [TEI 离线接入](../backend/tei_handoff.md)。既有 mock 路由见 [Mock API](../backend/README.md)。

## 答辩演示

本机已有示例时，从仓库根目录运行下面的命令。PowerShell 会直接显示论文对、引用次数及原文段落，适合在网络受限时展示。

```powershell
python -m backend.show_citations --bundle .local/tei-demo --source P9007 --reference P9001
```

演示说法：「以 MRAgent 和 A-Mem 为例，这批缓存里识别到了 6 处引用。矩阵里的 6 可以展开成 6 条原文记录。在前端接上之后，点矩阵单元格就是同样的查询。」

如要给前端联调，在另一个窗口启动服务，再打开 [矩阵](http://127.0.0.1:8000/api/v0/experimental/citation-matrix?source_paper_id=P9007) 和 [引用明细](http://127.0.0.1:8000/api/v0/experimental/citations?source_paper_id=P9007&reference_id=P9001)。这些链接显示接口数据。演示包只在本机保存，组员使用自己的 TEI 缓存按离线接入文档生成数据包。

```powershell
python -m backend.mock_api --bundle .local/tei-demo --port 8000
```

这批 9 篇真实缓存生成了 484 条引用记录、282 个非空格子、21 条库内引用边。逐格检查过计数与下钻一致。97 个 GROBID 引用标记没有目标，记入导入报告。这批缓存没有可用的页码坐标，可展示章节和原文段落。Claim 关系、条件与证据的现成示例使用 mock，真实抽取等待 D 交付。

## 如何检查 GROBID

本轮环境未能从配置地址取得 HTTP 响应，在线解析暂未验收。

在可访问服务的机器上设置 `MATRIX_GROBID_URL`，然后检查 `/api/isalive`。真实配置与论文缓存只保存在本机。

```powershell
curl.exe --noproxy "*" --connect-timeout 5 --max-time 10 "$($env:MATRIX_GROBID_URL)/api/isalive"
```

返回 `true` 表示服务存活。随后用旧科研矩阵表工具验证一份**尚无缓存**的 PDF 能生成 TEI，再使用离线导入命令接入。连接失败时，可以用已有缓存继续导入和联调。

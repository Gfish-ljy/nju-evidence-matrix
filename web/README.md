# EvidenceMatrix Web · UI v1

Apple-inspired research intelligence prototype for exploring how scientific claims, conditions, evidence, and knowledge states evolve.

> 设计说明：Research Landscape 按本轮需求保持 **2D 语义地图**，没有引入装饰性 3D 场景。知识对象的关系通过图层、节点、连线、Inspector 和时间快照表达。

## Run

```bash
cd web
npm install
npm run dev
```

Demo URL: http://127.0.0.1:5173

```bash
npm run build
```

## Pages

| Page | Implemented |
|---|---|
| **Workspace** | Research workbench: compact domain header, active research questions, recent knowledge updates, opportunities to validate, continue-exploring |
| **Research Landscape** | 2D semantic map with topic hulls; Claim / Paper / Relation views; **Semantic Similarity / Evidence Relations / Temporal Evolution** layers; zoom/pan; topic focus & zoom; selected-claim neighbour highlight; inspector |
| **Evidence Matrix** | Problem rail; topic scope from Landscape; relation matrix / condition matrix; active row + column highlight; color + symbol + tooltip; judgement inspector; claim click → Explorer |
| **Evidence Explorer** | Claim/condition/evidence rail + mock PDF; evidence click auto-jumps and highlights page; direct-quote vs system-extraction vs system-inference tags; mock warning; back preserves matrix context |
| **Knowledge Timeline** | Dark theme; time scrubber; historical snapshots; maps + stats sync; replay; A/B comparison with added/removed/state-changed claims; update inspector with evidence changes and all three timestamps |
| **Research Opportunities** | Conflict / condition-gap / limitation candidates; discovery basis, support & counter evidence, related papers, boundary, validation checklist; Candidate vs Validated separation; time-aware discovery |

Direct links:

```
/?page=landscape&layer=evidence
/?page=landscape&layer=temporal
/?page=matrix&scope=topic&topic=T3
/?page=matrix&problem=P2&time=2024.6
/?page=explorer&claim=C31&evidence=E62
/?page=timeline&time=2026.8&a=2024.5&b=2026.8
/?page=opportunities&opp=O1
```

## Cross-page exploration

1. Landscape topic → **Open all N claims in Matrix** sets topic scope (`matrixScope='topic'`).
2. Matrix claim row → Evidence Explorer opens that claim; back returns to the previous Matrix problem.
3. Explorer evidence → PDF page jumps and highlights the quote; selected evidence is carried in the global store.
4. Timeline time → all other pages render the corresponding snapshot and show a dismissible **Historical snapshot** banner.
5. Opportunities → related matrix / supporting claim in Explorer / shared Inspector.
6. All details use the single global Inspector (claim, paper, relation, knowledge update), not per-page drawers.

## Design system

- Warm white canvas, solid white surfaces, hairline borders, light functional shadows.
- Semantic colors for six knowledge states and six relation types; no decorative gradients.
- Inter + system CJK fallback; 40–44px display, 34px page titles, 14px body, 10–12px metadata.
- 7–12px controls, 16–18px panels; 180–240ms motion.
- Timeline is the only dark surface.

## Component structure

```
src/
  App.tsx                    shell: sidebar, topbar, page transition, inspector, search, toast
  store.ts                   page, filters, inspector, timeline, matrix scope, return context
  data/
    types.ts                 Paper / Claim / Condition / Evidence / Relation / Event / Opportunity
    demo.ts                  20 papers, 40 claims, 80 evidence, 31 relations, 10 events, 6 opportunities
    selectors.ts             joins, time snapshots, state-at-time, comparisons
  components/
    Sidebar, TopBar, Inspector, SearchOverlay, StatusPill, SnapshotBanner, Toast
  pages/
    Workspace, Landscape, Matrix, Explorer, Timeline, Opportunities
```

## Interactions verified

- Topic click zooms and dims other regions; “Open all claims in Matrix” applies topic scope.
- Landscape layers switch point encoding and edge visibility; wheel zoom, drag pan, node selection, claim neighbour highlight.
- Matrix relation cell → active row/column + Inspector; claim row → Explorer; back → Matrix with problem retained.
- Explorer evidence selection → PDF page and highlight; evidence type tags; mock labels.
- Timeline replay changes snapshots; A/B compare shows added/removed/state-changed claims; event inspector shows evidence changes.
- Opportunity status changes work; historical snapshots filter opportunities by discovery date.
- Global search (⌘K / Ctrl+K) returns papers, claims, problems.
- Production build passes; all pages checked for runtime exceptions.

## Mock vs real data

All data in `data/demo.ts` is **fictional demo data**:

- 20 papers / 40 claims / 80 evidence snippets / 31 relations / 10 events / 6 opportunities.
- PDF pages, quotes, and highlighting are simulated; the UI labels them **Mock PDF / Mock evidence**.
- No real research-evidence claims are fabricated as real sources.

## Backend integration

Keep the `DemoData` types and replace the demo selectors with API calls. Suggested mapping (see `../docs/api_contract_v0.md`):

| UI need | API |
|---|---|
| Papers / domain statistics | `GET /api/v0/papers` |
| Claims / conditions | `GET /api/v0/claims`, `GET /api/v0/claims/{id}` |
| Evidence | `GET /api/v0/claims/{id}/evidence` |
| Relations | `GET /api/v0/relations` |
| Landscape positions / graph edges | `GET /api/v0/graph?level=claim` |
| Matrix cells | `GET /api/v0/matrix` |
| Snapshot states / updates | `GET /api/v0/knowledge-states`, `GET /api/v0/updates` |
| Review | `POST /api/v0/review/claims/{id}` |
| Opportunities | new endpoint reusing Claim/Evidence/Relation objects |

Backend still needed for: real PDF page coordinates and PDF.js viewer, persisted reviews/opportunity statuses, server-side semantic layout, authentication, multi-domain ingestion, and larger-scale virtualization.

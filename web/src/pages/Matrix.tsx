import { ArrowUpRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  DATA,
  claimsForProblem,
  paperById,
  problemById,
  snapshotAt,
  topicById,
} from '../data/selectors'
import type { Claim, KnowledgeStatus, Relation, RelationType } from '../data/types'
import { useApp } from '../store'
import { SnapshotBanner } from '../components/SnapshotBanner'
import {
  RELATION_COLORS,
  RELATION_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../ui/labels'

const LETTER: Record<RelationType, string> = {
  Supports: 'S',
  Contradicts: 'C',
  Extends: 'E',
  Refines: 'R',
  Qualifies: 'Q',
  Supersedes: 'X',
}

interface CellRef {
  row: string
  col: string
  relId: string
}

function ConditionsMatrix({
  claims,
  stateOf,
  openExplorer,
}: {
  claims: Claim[]
  stateOf: (c: Claim) => KnowledgeStatus
  openExplorer: (id: string) => void
}) {
  const [dim, setDim] = useState<'method' | 'dataset' | 'metric'>('dataset')
  const valueOf = (c: Claim): string[] => {
    if (dim === 'method') return [c.method]
    if (dim === 'dataset') return [c.condition.dataset]
    return c.condition.metrics
  }
  const cols = useMemo(() => {
    const set = new Set<string>()
    for (const c of claims) for (const v of valueOf(c)) set.add(v)
    return [...set].slice(0, 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claims, dim])

  return (
    <>
      <div className="matrix-toolbar">
        <span className="muted">Columns</span>
        <select value={dim} onChange={(e) => setDim(e.target.value as typeof dim)}>
          <option value="dataset">Dataset</option>
          <option value="method">Method</option>
          <option value="metric">Metric</option>
        </select>
        <span className="muted small">Click a claim to open its evidence.</span>
      </div>
      <div className="matrix-scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th className="sticky-col">Claim</th>
              {cols.map((c) => (
                <th key={c} className="cond-head">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <th className="sticky-col row-claim" onClick={() => openExplorer(c.id)}>
                  <span className="dot" style={{ background: STATUS_COLORS[stateOf(c)] }} />
                  <span className="mono">{c.id}</span>
                  <span className="row-paper">{paperById[c.paperId].year} · {paperById[c.paperId].venue}</span>
                  <span className="row-claim-text">{c.statement}</span>
                </th>
                {cols.map((col) => {
                  const hit = valueOf(c).includes(col)
                  return (
                    <td
                      key={col}
                      className={hit ? 'cond-hit' : ''}
                      onClick={() => hit && openExplorer(c.id)}
                    >
                      {hit ? '●' : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function Matrix() {
  const selectedProblemId = useApp((s) => s.selectedProblemId)
  const setProblem = useApp((s) => s.setProblem)
  const matrixMode = useApp((s) => s.matrixMode)
  const setMatrixMode = useApp((s) => s.setMatrixMode)
  const matrixScope = useApp((s) => s.matrixScope)
  const matrixTopicId = useApp((s) => s.matrixTopicId)
  const filters = useApp((s) => s.filters)
  const setFilter = useApp((s) => s.setFilter)
  const inspect = useApp((s) => s.inspect)
  const openExplorer = useApp((s) => s.openExplorer)
  const time = useApp((s) => s.time)

  const snap = useMemo(() => snapshotAt(time), [time])
  const problem = problemById[selectedProblemId ?? 'P2']
  const topic = topicById[problem.topicId]
  const scopeTopic =
    matrixScope === 'topic' && matrixTopicId ? topicById[matrixTopicId] : null

  const allClaims = useMemo(() => {
    const pool = snap.claims.filter((c) =>
      scopeTopic
        ? problemById[c.problemId].topicId === scopeTopic.id
        : c.problemId === problem.id,
    )
    return pool.sort((a, b) => {
      const ya = paperById[a.paperId].year
      const yb = paperById[b.paperId].year
      return ya - yb || a.id.localeCompare(b.id)
    })
  }, [snap.claims, scopeTopic, problem.id])

  const stateOf = (c: Claim) => snap.states[c.id] ?? c.status
  const claims = allClaims.filter(
    (c) => filters.status === 'all' || stateOf(c) === filters.status,
  )
  const claimIds = new Set(allClaims.map((c) => c.id))
  const relations = useMemo(
    () =>
      snap.relations.filter(
        (r) =>
          claimIds.has(r.sourceId) &&
          claimIds.has(r.targetId) &&
          (filters.relation === 'all' || r.type === filters.relation),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap.relations, allClaims, filters.relation],
  )
  const relationMap = useMemo(() => {
    const map = new Map<string, Relation>()
    for (const r of relations) {
      map.set(`${r.sourceId}|${r.targetId}`, r)
      map.set(`${r.targetId}|${r.sourceId}`, r)
    }
    return map
  }, [relations])

  const [active, setActive] = useState<CellRef | null>(null)

  const problemsByTopic = DATA.topics.map((t) => ({
    topic: t,
    problems: DATA.problems.filter((p) => p.topicId === t.id),
  }))

  return (
    <div className="page matrix-page">
      <SnapshotBanner />
      <div className="page-head">
        <div>
          <div className="eyebrow">
            Evidence Matrix · {scopeTopic ? scopeTopic.name : topic.name}
          </div>
          <h1>
            {scopeTopic
              ? `${scopeTopic.name} · ${allClaims.length} claims`
              : problem.question}
          </h1>
          <p className="lede small">
            {scopeTopic
              ? 'Topic scope opened from Landscape. All claims in this topic share one evidence matrix.'
              : problem.description}
          </p>
          {scopeTopic && (
            <button
              className="scope-chip"
              onClick={() => setProblem(problem.id)}
              title="Clear topic scope"
            >
              Topic scope: {scopeTopic.name} <X size={12} />
            </button>
          )}
        </div>
        <div className="segmented">
          <button
            className={matrixMode === 'relations' ? 'active' : ''}
            onClick={() => setMatrixMode('relations')}
          >
            Relations
          </button>
          <button
            className={matrixMode === 'conditions' ? 'active' : ''}
            onClick={() => setMatrixMode('conditions')}
          >
            Conditions
          </button>
        </div>
      </div>

      <div className="matrix-layout">
        <aside className="problem-rail">
          <div className="rail-title">Research Problems</div>
          {problemsByTopic.map(({ topic: t, problems }) => (
            <div key={t.id} className="rail-group">
              <div className="rail-topic">
                <i style={{ background: t.color }} />
                {t.name}
              </div>
              {problems.map((p) => (
                <button
                  key={p.id}
                  className={`rail-problem ${p.id === problem.id && !scopeTopic ? 'active' : ''}`}
                  onClick={() => setProblem(p.id)}
                >
                  <span>{p.question}</span>
                  <span className="count">
                    {snap.claims.filter((c) => c.problemId === p.id).length}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="matrix-main">
          <div className="matrix-toolbar">
            <div className="control-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilter({ status: e.target.value as typeof filters.status })}
              >
                <option value="all">All</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {matrixMode === 'relations' && (
              <div className="control-group">
                <label>Relation</label>
                <select
                  value={filters.relation}
                  onChange={(e) =>
                    setFilter({ relation: e.target.value as typeof filters.relation })
                  }
                >
                  <option value="all">All</option>
                  {Object.entries(RELATION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="muted small">
              {claims.length} claims · {allClaims.length - claims.length} hidden by filter
            </span>
            <button
              className="text-link"
              onClick={() => openExplorer(claims[0]?.id ?? allClaims[0]?.id)}
            >
              Open first claim in Explorer <ArrowUpRight size={14} />
            </button>
          </div>

          {matrixMode === 'conditions' ? (
            <ConditionsMatrix claims={claims} stateOf={stateOf} openExplorer={openExplorer} />
          ) : (
            <div className="matrix-scroll">
              <table className="matrix">
                <thead>
                  <tr>
                    <th className="sticky-col">Claim</th>
                    {claims.map((c) => (
                      <th
                        key={c.id}
                        className={`col-head ${active?.col === c.id ? 'col-active' : ''}`}
                        title={c.statement}
                      >
                        {c.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {claims.map((row) => (
                    <tr key={row.id} className={active?.row === row.id ? 'row-active' : ''}>
                      <th
                        className="sticky-col row-claim"
                        onClick={() => openExplorer(row.id)}
                        title="Open claim in Evidence Explorer"
                      >
                        <span className="dot" style={{ background: STATUS_COLORS[stateOf(row)] }} />
                        <span className="mono">{row.id}</span>
                        <span className="row-paper">
                          {paperById[row.paperId].year} · {paperById[row.paperId].venue}
                        </span>
                        <span className="row-claim-text">{row.statement}</span>
                      </th>
                      {claims.map((col) => {
                        if (row.id === col.id) {
                          return (
                            <td key={col.id} className="diag">
                              <span
                                className="dot"
                                style={{ background: STATUS_COLORS[stateOf(row)] }}
                              />
                            </td>
                          )
                        }
                        const rel = relationMap.get(`${row.id}|${col.id}`)
                        if (!rel) {
                          return <td key={col.id} className="empty-cell" />
                        }
                        return (
                          <td
                            key={col.id}
                            className={`rel-cell ${active?.relId === rel.id ? 'cell-active' : ''}`}
                            style={{
                              background: RELATION_COLORS[rel.type] + '14',
                              color: RELATION_COLORS[rel.type],
                            }}
                            title={`${RELATION_LABELS[rel.type]} · confidence ${Math.round(rel.confidence * 100)}% · ${rel.rationale}`}
                            onClick={() => {
                              setActive({ row: row.id, col: col.id, relId: rel.id })
                              inspect('relation', rel.id)
                            }}
                          >
                            {LETTER[rel.type]}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {claims.length === 0 && (
                <div className="empty-state">No claims match the current filter.</div>
              )}
            </div>
          )}

          {matrixMode === 'relations' && (
            <div className="matrix-legend">
              {(Object.keys(RELATION_COLORS) as RelationType[]).map((t) => (
                <span key={t}>
                  <b style={{ color: RELATION_COLORS[t] }}>{LETTER[t]}</b> {RELATION_LABELS[t]}
                </span>
              ))}
              <span className="muted">Click a cell to inspect the evidence judgement.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

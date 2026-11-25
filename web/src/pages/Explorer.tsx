import { ArrowLeft, ArrowRight, ArrowUpRight, FileText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  claimById,
  evidenceForClaim,
  paperById,
  problemById,
  snapshotAt,
} from '../data/selectors'
import { useApp } from '../store'
import { RelationPill, StatusPill } from '../components/StatusPill'
import { SnapshotBanner } from '../components/SnapshotBanner'
import { STATUS_LABELS_ZH } from '../ui/labels'

const FILLER = [
  'We describe the experimental setup, the memory store configuration, and the prompts used across all runs. Unless stated otherwise, each result is averaged over three seeds.',
  'The retrieval layer is queried with the current task instruction. Retrieved entries are concatenated in timestamp order and passed to the agent together with a short working-memory summary.',
  'We report the primary metric alongside a secondary check on answer faithfulness. Differences below one point are treated as noise in this demo dataset.',
  'Manual inspection of 40 sampled trajectories suggests that failures cluster around stale facts and ambiguous references rather than retrieval misses.',
]

export function Explorer() {
  const selectedClaimId = useApp((s) => s.selectedClaimId)
  const selectedEvidenceId = useApp((s) => s.selectedEvidenceId)
  const returnPage = useApp((s) => s.returnPage)
  const backFromExplorer = useApp((s) => s.backFromExplorer)
  const openMatrix = useApp((s) => s.openMatrix)
  const inspect = useApp((s) => s.inspect)
  const time = useApp((s) => s.time)

  const snap = useMemo(() => snapshotAt(time), [time])
  const claim = claimById[selectedClaimId ?? 'C31']
  const paper = paperById[claim.paperId]
  const problem = problemById[claim.problemId]
  const evidence = evidenceForClaim(claim.id)
  const relations = snap.relations.filter(
    (r) => r.sourceId === claim.id || r.targetId === claim.id,
  )
  const state = snap.states[claim.id] ?? claim.status
  const initialEvidence = evidence.find((e) => e.id === selectedEvidenceId) ?? evidence[0]

  const [evidenceId, setEvidenceId] = useState(initialEvidence?.id)
  const [page, setPage] = useState(initialEvidence?.page ?? 1)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const base = evidence.find((e) => e.id === selectedEvidenceId) ?? evidence[0]
    setEvidenceId(base?.id)
    setPage(base?.page ?? 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.id, selectedEvidenceId])

  const current = evidence.find((e) => e.id === evidenceId) ?? evidence[0]
  const pageCount = 12
  const highlight = current && page === current.page

  const pageText = useMemo(() => {
    return FILLER[(page + claim.id.charCodeAt(1)) % FILLER.length]
  }, [page, claim.id])

  const backLabel =
    returnPage === 'matrix'
      ? 'Back to Matrix'
      : returnPage === 'landscape'
        ? 'Back to Landscape'
        : returnPage === 'timeline'
          ? 'Back to Timeline'
          : returnPage === 'opportunities'
            ? 'Back to Opportunities'
            : returnPage === 'workspace'
              ? 'Back to Workspace'
              : 'Back'

  return (
    <div className="page explorer-page">
      <SnapshotBanner />
      <div className="page-head">
        <div>
          <div className="eyebrow">Evidence Explorer</div>
          <div className="split-line">
            <h1>{claim.statement}</h1>
            <span className="type-tag">System extraction · Claim</span>
          </div>
          <p className="lede small">
            Follow the chain: Claim → Relation → Evidence → Paper → original page.
          </p>
        </div>
        <div className="head-actions">
          <button className="btn" onClick={backFromExplorer}>
            <ArrowLeft size={14} /> {backLabel}
          </button>
          <button className="btn" onClick={() => openMatrix(claim.problemId)}>
            Open in Matrix
          </button>
          <button className="btn" onClick={() => inspect('paper', paper.id)}>
            Paper details
          </button>
        </div>
      </div>

      <div className="mock-warning">
        <b>Mock evidence.</b> Quotes, conditions, and PDF pages are synthetic demo data, not
        real papers. The PDF layout and highlighting are simulated.
      </div>

      <div className="explorer-grid">
        <aside className="explorer-rail">
          <div className="rail-block">
            <div className="meta-line">
              <span className="mono">{claim.id}</span>
              <StatusPill status={state} small />
              <span className="type-tag small">System extraction</span>
            </div>
            <button className="link-row" onClick={() => inspect('paper', paper.id)}>
              <span>{paper.title}</span>
              <ArrowUpRight size={14} />
            </button>
            <div className="muted small">
              {paper.authors} · {paper.venue} {paper.year}
            </div>
          </div>

          <div className="rail-block">
            <div className="mini-title">Research Problem</div>
            <button className="link-row" onClick={() => openMatrix(problem.id)}>
              <span>{problem.question}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="rail-block">
            <div className="mini-title">Conditions · extracted</div>
            <div className="kv-grid">
              <span>Dataset</span><b>{claim.condition.dataset}</b>
              <span>Model</span><b>{claim.condition.model}</b>
              <span>Task</span><b>{claim.condition.task}</b>
              <span>Metrics</span><b>{claim.condition.metrics.join(', ')}</b>
              {claim.condition.scale && (<><span>Scale</span><b>{claim.condition.scale}</b></>)}
            </div>
          </div>

          <div className="rail-block">
            <div className="mini-title">Finding & Limitation</div>
            <p className="rail-text">{claim.finding}</p>
            <p className="rail-text muted">{claim.limitation}</p>
          </div>

          <div className="rail-block">
            <div className="mini-title">Evidence · {evidence.length}</div>
            {evidence.map((e) => (
              <button
                key={e.id}
                className={`evidence-nav ${e.id === current?.id ? 'active' : ''}`}
                onClick={() => {
                  setEvidenceId(e.id)
                  setPage(e.page)
                }}
              >
                <div className="evidence-nav-head">
                  <span className="mono">{e.id}</span>
                  <span className="type-tag small">Direct quote</span>
                  <span>{e.section} · p.{e.page}</span>
                </div>
                <p>{e.quote}</p>
              </button>
            ))}
          </div>

          <div className="rail-block">
            <div className="mini-title">
              Relations · {relations.length} <span className="type-tag small">System inference</span>
            </div>
            {relations.map((r) => {
              const other = r.sourceId === claim.id ? r.targetId : r.sourceId
              return (
                <button
                  key={r.id}
                  className="relation-link"
                  onClick={() => inspect('relation', r.id)}
                >
                  <RelationPill type={r.type} small />
                  <span className="mono">{other}</span>
                  <span className="muted small">
                    {r.comparability} · {Math.round(r.confidence * 100)}%
                  </span>
                </button>
              )
            })}
            {relations.length === 0 && (
              <div className="muted small">No relations available at this snapshot.</div>
            )}
          </div>
        </aside>

        <section className="pdf-shell">
          <div className="pdf-toolbar">
            <div className="pdf-title">
              <FileText size={15} />
              <span>{paper.title}</span>
              <span className="pdf-badge">Mock PDF</span>
            </div>
            <div className="pdf-controls">
              <button className="icon-btn" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                <ArrowLeft size={15} />
              </button>
              <span className="page-number">{page} / {pageCount}</span>
              <button className="icon-btn" onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
                <ArrowRight size={15} />
              </button>
              <span className="zoom">{Math.round(zoom * 100)}%</span>
              <button className="icon-btn" onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}>−</button>
              <button className="icon-btn" onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}>+</button>
            </div>
          </div>

          <div className="pdf-stage">
            <div className="pdf-page" style={{ transform: `scale(${zoom})` }}>
              <div className="pdf-running">
                {paper.venue} · {paper.year} · Mock PDF layout
              </div>
              <h1>{paper.title}</h1>
              <div className="pdf-authors">{paper.authors}</div>
              <div className="pdf-abstract">
                <b>Abstract.</b> {paper.abstract}
              </div>
              <h2>{current?.section ?? 'Results'}</h2>
              <p>{pageText}</p>
              {highlight && current ? (
                <p className="pdf-highlight-paragraph">
                  <mark>“{current.quote}”</mark>
                </p>
              ) : (
                <p>
                  The selected evidence is on page {current?.page ?? '—'}. This page is part
                  of the simulated context view.
                </p>
              )}
              <p>{FILLER[(page + 1) % FILLER.length]}</p>
              <div className="pdf-foot">
                {paper.id} · page {page} · mock
              </div>
            </div>
          </div>

          {current && (
            <div className="pdf-evidence-bar">
              <span className="mono">{current.id}</span>
              <span className="type-tag small">Direct quote</span>
              <span className="pdf-quote">“{current.quote}”</span>
              <span className="muted small">
                {STATUS_LABELS_ZH[state]} · {current.section} · p.{current.page}
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

import { Check, Circle, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  DATA,
  claimById,
  decimalYear,
  evidenceForClaim,
  paperById,
  problemById,
} from '../data/selectors'
import type { OpportunityStatus, OpportunityType } from '../data/types'
import { useApp } from '../store'
import {
  OPPORTUNITY_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from '../ui/labels'
import { StatusPill } from '../components/StatusPill'
import { SnapshotBanner } from '../components/SnapshotBanner'

const TYPES: Array<'all' | OpportunityType> = [
  'all',
  'conflict',
  'condition-gap',
  'limitation',
]

const STATUS_ACTIONS: OpportunityStatus[] = [
  'Pending',
  'Validating',
  'Needs Validation',
  'Validated',
  'Rejected',
]

export function Opportunities() {
  const selectedId = useApp((s) => s.selectedOpportunityId)
  const setSelected = useApp((s) => s.openOpportunity)
  const statusOverride = useApp((s) => s.opportunityStatus)
  const setStatus = useApp((s) => s.setOpportunityStatus)
  const openMatrix = useApp((s) => s.openMatrix)
  const openExplorer = useApp((s) => s.openExplorer)
  const inspect = useApp((s) => s.inspect)
  const time = useApp((s) => s.time)
  const [type, setType] = useState<'all' | OpportunityType>('all')

  const available = DATA.opportunities.filter((o) => decimalYear(o.discoveredAt) <= time)
  const list = available.filter((o) => type === 'all' || o.type === type)
  const selected = list.find((o) => o.id === (selectedId ?? 'O1')) ?? list[0]
  const status = selected ? statusOverride[selected.id] ?? selected.status : 'Pending'
  const problem = selected ? problemById[selected.problemId] : null
  const support = selected ? selected.supportClaimIds.map((id) => claimById[id]) : []
  const counter = selected ? selected.counterClaimIds.map((id) => claimById[id]) : []

  const validationDone = useMemo(
    () => (selected ? selected.validation.filter((v) => v.done).length : 0),
    [selected],
  )

  if (!selected) {
    return (
      <div className="page opportunities-page">
        <SnapshotBanner />
        <div className="page-head">
          <div>
            <div className="eyebrow">Research Opportunities</div>
            <h1>No opportunities discovered at this time.</h1>
            <p className="lede small">
              Opportunities appear only after their discovery event. Move the timeline
              forward or return to the latest snapshot.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page opportunities-page">
      <SnapshotBanner />
      <div className="page-head">
        <div>
          <div className="eyebrow">Research Opportunities</div>
          <h1>Candidate gaps, kept separate from validation.</h1>
          <p className="lede small">
            Every opportunity is a candidate derived from the evidence graph. Validation is a
            separate state — an unverified candidate is not a confirmed research gap.
          </p>
        </div>
        <div className="segmented">
          {TYPES.map((t) => (
            <button
              key={t}
              className={type === t ? 'active' : ''}
              onClick={() => setType(t)}
            >
              {t === 'all' ? 'All' : OPPORTUNITY_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="opp-layout">
        <aside className="opp-list">
          {list.map((o) => {
            const st = statusOverride[o.id] ?? o.status
            return (
              <button
                key={o.id}
                className={`opp-card ${selected.id === o.id ? 'active' : ''}`}
                onClick={() => setSelected(o.id)}
              >
                <div className="opp-card-top">
                  <span className="opp-type">{OPPORTUNITY_LABELS[o.type]}</span>
                  <span
                    className="opp-status"
                    style={{ color: OPPORTUNITY_STATUS_COLORS[st] }}
                  >
                    ● {st}
                  </span>
                </div>
                <div className="opp-question">{o.question}</div>
                <div className="opp-card-bottom">
                  <span>{o.supportClaimIds.length} supporting claims</span>
                  <span>{o.paperIds.length} papers</span>
                </div>
              </button>
            )
          })}
        </aside>

        <section className="opp-detail">
          <div className="opp-detail-head">
            <div>
              <div className="eyebrow">{OPPORTUNITY_LABELS[selected.type]} · {selected.id}</div>
              <h2>{selected.question}</h2>
              <div className="opp-meta">
                <span
                  className="opp-status strong"
                  style={{ color: OPPORTUNITY_STATUS_COLORS[status] }}
                >
                  ● {status}
                </span>
                <span>Discovered {selected.discoveredAt}</span>
                <button className="text-link" onClick={() => openMatrix(selected.problemId)}>
                  {problem.question} <ExternalLink size={13} />
                </button>
              </div>
            </div>
            <div className="validation-progress">
              <b>{validationDone}/{selected.validation.length}</b>
              <span>validation steps</span>
            </div>
          </div>

          {status !== 'Validated' && (
            <div className="candidate-banner">
              Candidate — not a confirmed gap. Review the counter-evidence and validation
              boundary before acting on it.
            </div>
          )}

          <div className="opp-grid">
            <div className="opp-col">
              <div className="mini-title">Discovery Basis</div>
              <p className="body-text">{selected.basis}</p>

              <div className="mini-title">Supporting Evidence</div>
              {support.map((c) => (
                <button key={c.id} className="opp-claim" onClick={() => inspect('claim', c.id)}>
                  <span className="mono">{c.id}</span>
                  <p>{c.statement}</p>
                  <StatusPill status={c.status} small />
                  <span className="quote">{evidenceForClaim(c.id)[0]?.quote}</span>
                </button>
              ))}

              <div className="mini-title">Counter Evidence</div>
              {counter.map((c) => (
                <button key={c.id} className="opp-claim counter" onClick={() => inspect('claim', c.id)}>
                  <span className="mono">{c.id}</span>
                  <p>{c.statement}</p>
                  <StatusPill status={c.status} small />
                </button>
              ))}
            </div>

            <div className="opp-col">
              <div className="mini-title">Related Papers</div>
              {selected.paperIds.map((id) => {
                const p = paperById[id]
                return (
                  <button key={id} className="opp-paper" onClick={() => inspect('paper', id)}>
                    <span className="mono">{p.id}</span>
                    <span>{p.title}</span>
                    <span className="muted small">{p.venue} {p.year}</span>
                  </button>
                )
              })}

              <div className="mini-title">Existing Research Boundary</div>
              <p className="body-text muted">{selected.boundary}</p>

              <div className="mini-title">Suggested Validation</div>
              <p className="body-text">{selected.suggestedValidation}</p>

              <div className="mini-title">Validation Checklist</div>
              <div className="checklist">
                {selected.validation.map((v) => (
                  <div key={v.label} className={`check ${v.done ? 'done' : ''}`}>
                    {v.done ? <Check size={14} /> : <Circle size={14} />}
                    <span>{v.label}</span>
                    {v.note && <em>{v.note}</em>}
                  </div>
                ))}
              </div>

              <div className="mini-title">Update Status</div>
              <div className="status-actions">
                {STATUS_ACTIONS.map((s) => (
                  <button
                    key={s}
                    className={status === s ? 'active' : ''}
                    style={{ borderColor: OPPORTUNITY_STATUS_COLORS[s] }}
                    onClick={() => setStatus(selected.id, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="opp-actions">
            <button className="btn primary" onClick={() => openMatrix(selected.problemId)}>
              Open related matrix
            </button>
            <button className="btn" onClick={() => openExplorer(support[0].id)}>
              Open supporting claim in Explorer
            </button>
            <button className="btn" onClick={() => inspect('claim', support[0].id)}>
              Inspect supporting claim
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

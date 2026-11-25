import { motion } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import {
  DATA,
  claimById,
  claimsForPaper,
  evidenceForClaim,
  eventById,
  paperById,
  problemById,
  decimalYear,
  relationById,
  relationsForClaim,
} from '../data/selectors'
import { useApp } from '../store'
import { RelationPill, StatusPill } from './StatusPill'
import { STATUS_LABELS_ZH } from '../ui/labels'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ins-section">
      <div className="ins-section-title">{title}</div>
      {children}
    </section>
  )
}

function ClaimView({ id }: { id: string }) {
  const claim = claimById[id]
  const paper = paperById[claim.paperId]
  const problem = problemById[claim.problemId]
  const evidence = evidenceForClaim(claim.id)
  const relations = relationsForClaim(claim.id)
  const inspect = useApp((s) => s.inspect)
  const openExplorer = useApp((s) => s.openExplorer)
  const openMatrix = useApp((s) => s.openMatrix)

  return (
    <>
      <div className="ins-head">
        <div>
          <div className="eyebrow">Claim · {claim.id}</div>
          <h2>{claim.statement}</h2>
        </div>
        <button className="icon-btn" onClick={() => useApp.getState().closeInspector()}>
          <X size={17} />
        </button>
      </div>
      <div className="ins-meta">
        <StatusPill status={claim.status} />
        <span>{paper.year}</span>
        <span>{paper.venue}</span>
      </div>

      <Section title="Paper">
        <button className="link-row" onClick={() => inspect('paper', paper.id)}>
          <span>{paper.title}</span>
          <ArrowUpRight size={14} />
        </button>
        <div className="muted small">{paper.authors}</div>
      </Section>

      <Section title="Research Problem">
        <button className="link-row" onClick={() => openMatrix(claim.problemId)}>
          <span>{problem.question}</span>
          <ArrowUpRight size={14} />
        </button>
      </Section>

      <Section title="Conditions">
        <div className="kv-grid">
          <span>Dataset</span><b>{claim.condition.dataset}</b>
          <span>Model</span><b>{claim.condition.model}</b>
          <span>Task</span><b>{claim.condition.task}</b>
          <span>Metrics</span><b>{claim.condition.metrics.join(', ')}</b>
          {claim.condition.scale && (<><span>Scale</span><b>{claim.condition.scale}</b></>)}
        </div>
      </Section>

      <Section title="Finding">
        <p className="ins-text">{claim.finding}</p>
      </Section>

      <Section title="Limitation">
        <p className="ins-text muted">{claim.limitation}</p>
      </Section>

      <Section title={`Evidence · ${evidence.length}`}>
        {evidence.map((e) => (
          <button
            key={e.id}
            className="evidence-item"
            onClick={() => openExplorer(claim.id, e.id)}
          >
            <div className="evidence-item-head">
              <span className="mono">{e.id}</span>
              <span>{e.section} · p.{e.page}</span>
            </div>
            <p>“{e.quote}”</p>
          </button>
        ))}
      </Section>

      <Section title={`Relations · ${relations.length}`}>
        {relations.map((r) => {
          const otherId = r.sourceId === claim.id ? r.targetId : r.sourceId
          const other = claimById[otherId]
          return (
            <button
              key={r.id}
              className="relation-row"
              onClick={() => inspect('relation', r.id)}
            >
              <RelationPill type={r.type} small />
              <span className="mono">{otherId}</span>
              <span className="relation-summary">{other.statement}</span>
            </button>
          )
        })}
      </Section>

      <div className="ins-actions">
        <button className="btn primary" onClick={() => openExplorer(claim.id)}>
          Open in Explorer
        </button>
        <button className="btn" onClick={() => openMatrix(claim.problemId)}>
          Open Matrix
        </button>
      </div>
    </>
  )
}

function PaperView({ id }: { id: string }) {
  const paper = paperById[id]
  const claims = claimsForPaper(id)
  const inspect = useApp((s) => s.inspect)
  const openLandscape = useApp((s) => s.openLandscape)

  return (
    <>
      <div className="ins-head">
        <div>
          <div className="eyebrow">Paper · {paper.id}</div>
          <h2>{paper.title}</h2>
        </div>
        <button className="icon-btn" onClick={() => useApp.getState().closeInspector()}>
          <X size={17} />
        </button>
      </div>
      <div className="ins-meta">
        <span>{paper.authors}</span>
        <span>{paper.venue} · {paper.year}</span>
      </div>
      <Section title="Abstract">
        <p className="ins-text">{paper.abstract}</p>
      </Section>
      <Section title="Timestamps">
        <div className="kv-grid">
          <span>Published</span><b>{paper.publishedAt}</b>
          <span>Ingested</span><b>{paper.ingestedAt}</b>
          <span>Citations</span><b>{paper.citations}</b>
        </div>
      </Section>
      <Section title={`Claims · ${claims.length}`}>
        {claims.map((c) => (
          <button key={c.id} className="claim-row" onClick={() => inspect('claim', c.id)}>
            <div className="claim-row-head">
              <span className="mono">{c.id}</span>
              <StatusPill status={c.status} small />
            </div>
            <span>{c.statement}</span>
          </button>
        ))}
      </Section>
      <div className="ins-actions">
        <button className="btn" onClick={() => openLandscape(paper.topicId)}>
          View in Landscape
        </button>
      </div>
    </>
  )
}

function RelationView({ id }: { id: string }) {
  const r = relationById[id]
  const openExplorer = useApp((s) => s.openExplorer)
  const inspect = useApp((s) => s.inspect)
  if (!r) return null
  const source = claimById[r.sourceId]
  const target = claimById[r.targetId]
  const evidence = r.evidenceIds
    .map((eid) => evidenceForClaim(source.id).concat(evidenceForClaim(target.id)).find((e) => e.id === eid))
    .filter(Boolean)

  return (
    <>
      <div className="ins-head">
        <div>
          <div className="eyebrow">Relation · {r.id}</div>
          <h2>
            {source.id} <span className="muted">→</span> {target.id}
          </h2>
        </div>
        <button className="icon-btn" onClick={() => useApp.getState().closeInspector()}>
          <X size={17} />
        </button>
      </div>
      <div className="ins-meta">
        <RelationPill type={r.type} />
        <span>confidence {Math.round(r.confidence * 100)}%</span>
        <span>{r.comparability}</span>
      </div>
      <Section title="Judgement basis">
        <p className="ins-text">{r.rationale}</p>
      </Section>
      <Section title="Source claim">
        <button className="claim-card" onClick={() => inspect('claim', source.id)}>
          <span className="mono">{source.id}</span>
          <p>{source.statement}</p>
          <StatusPill status={source.status} small />
        </button>
      </Section>
      <Section title="Target claim">
        <button className="claim-card" onClick={() => inspect('claim', target.id)}>
          <span className="mono">{target.id}</span>
          <p>{target.statement}</p>
          <StatusPill status={target.status} small />
        </button>
      </Section>
      <Section title={`Evidence · ${evidence.length}`}>
        {evidence.map((e) => e && (
          <button key={e.id} className="evidence-item" onClick={() => openExplorer(e.claimId, e.id)}>
            <div className="evidence-item-head">
              <span className="mono">{e.id}</span>
              <span>{e.section} · p.{e.page}</span>
            </div>
            <p>“{e.quote}”</p>
          </button>
        ))}
      </Section>
    </>
  )
}

function EventView({ id }: { id: string }) {
  const event = eventById[id]
  const claim = claimById[event.claimId]
  const trigger = paperById[event.triggerPaperId]
  const inspect = useApp((s) => s.inspect)
  const openExplorer = useApp((s) => s.openExplorer)
  const openTimeline = useApp((s) => s.openTimeline)
  const eventEvidence = DATA.evidence.filter((e) => event.evidenceIds.includes(e.id))

  return (
    <>
      <div className="ins-head">
        <div>
          <div className="eyebrow">Knowledge update · {event.id}</div>
          <h2>{claim.statement}</h2>
        </div>
        <button className="icon-btn" onClick={() => useApp.getState().closeInspector()}>
          <X size={17} />
        </button>
      </div>
      <div className="ins-meta">
        <span>{STATUS_LABELS_ZH[event.from]}</span>
        <span>→</span>
        <span>{STATUS_LABELS_ZH[event.to]}</span>
      </div>
      <Section title="Why the state changed">
        <p className="ins-text">{event.reason}</p>
        <div className="muted small">
          {event.verified ? 'Verified by manual review' : 'Pending manual review'}
        </div>
      </Section>
      <Section title="Triggering paper">
        <button className="link-row" onClick={() => inspect('paper', trigger.id)}>
          <span>{trigger.title}</span>
          <ArrowUpRight size={14} />
        </button>
      </Section>
      <Section title={`Evidence changes · ${eventEvidence.length}`}>
        {eventEvidence.map((e) => (
          <div className="evidence-item" key={e.id}>
            <div className="evidence-item-head">
              <span className="mono">{e.id}</span>
              <span>{e.claimId} · {e.section} · p.{e.page}</span>
            </div>
            <p>“{e.quote}”</p>
          </div>
        ))}
      </Section>
      <Section title="Three timestamps">
        <div className="kv-grid">
          <span>Published</span><b>{trigger.publishedAt}</b>
          <span>Ingested</span><b>{trigger.ingestedAt}</b>
          <span>Updated</span><b>{event.time}</b>
        </div>
      </Section>
      <Section title="Affected claim">
        <button className="claim-card" onClick={() => inspect('claim', claim.id)}>
          <span className="mono">{claim.id}</span>
          <p>{claim.statement}</p>
          <StatusPill status={event.to} small />
        </button>
      </Section>
      <div className="ins-actions">
        <button className="btn primary" onClick={() => openExplorer(claim.id)}>
          Trace evidence
        </button>
        <button
          className="btn"
          onClick={() => openTimeline(decimalYear(event.time), event.id)}
        >
          Replay timeline
        </button>
      </div>
    </>
  )
}

export function Inspector() {
  const inspector = useApp((s) => s.inspector)
  if (!inspector) return null

  return (
    <motion.aside
      className="inspector"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {inspector.type === 'claim' && <ClaimView id={inspector.id} />}
      {inspector.type === 'paper' && <PaperView id={inspector.id} />}
      {inspector.type === 'relation' && <RelationView id={inspector.id} />}
      {inspector.type === 'event' && <EventView id={inspector.id} />}
    </motion.aside>
  )
}

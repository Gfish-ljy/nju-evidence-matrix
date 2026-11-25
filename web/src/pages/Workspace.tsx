import { ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import { useMemo } from 'react'
import {
  DATA,
  claimById,
  decimalYear,
  paperById,
  problemById,
  snapshotAt,
  timeLabel,
  topicById,
} from '../data/selectors'
import { useApp } from '../store'
import { SnapshotBanner } from '../components/SnapshotBanner'
import {
  OPPORTUNITY_LABELS,
  OPPORTUNITY_STATUS_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../ui/labels'

const FOCUS_PROBLEMS = ['P2', 'P3', 'P1', 'P5']

export function Workspace() {
  const navigate = useApp((s) => s.navigate)
  const inspect = useApp((s) => s.inspect)
  const openMatrix = useApp((s) => s.openMatrix)
  const openTimeline = useApp((s) => s.openTimeline)
  const openOpportunity = useApp((s) => s.openOpportunity)
  const setSearchOpen = useApp((s) => s.setSearchOpen)
  const setToast = useApp((s) => s.setToast)
  const recent = useApp((s) => s.recent)
  const time = useApp((s) => s.time)
  const opportunityStatus = useApp((s) => s.opportunityStatus)

  const snap = useMemo(() => snapshotAt(time), [time])
  const events = useMemo(
    () => [...snap.events].sort((a, b) => decimalYear(b.time) - decimalYear(a.time)).slice(0, 4),
    [snap.events],
  )

  const recentProblems = recent.filter((r) => r.kind === 'problem').map((r) => r.id)
  const questionIds = [
    ...recentProblems,
    ...FOCUS_PROBLEMS.filter((id) => !recentProblems.includes(id)),
  ]
  const questions = questionIds
    .map((id) => {
      const problem = problemById[id]
      const claims = snap.claims.filter((c) => c.problemId === id)
      const contested = claims.filter((c) => snap.states[c.id] === 'Contested').length
      return { problem, claims, contested, topic: topicById[problem.topicId] }
    })
    .filter((q) => q.claims.length > 0)

  const opportunities = DATA.opportunities
    .filter((o) => decimalYear(o.discoveredAt) <= time)
    .map((o) => ({ o, status: opportunityStatus[o.id] ?? o.status }))
    .filter((x) => ['Pending', 'Validating', 'Needs Validation'].includes(x.status))
    .slice(0, 3)

  const continueItems = recent.length
    ? recent
    : [
        {
          kind: 'claim' as const,
          id: 'C31',
          label: 'Audited editing reduces collateral forgetting to 6%.',
          sub: 'Claim · EditBench · P16',
        },
        {
          kind: 'problem' as const,
          id: 'P2',
          label: 'Does reflection-based consolidation improve long-horizon performance?',
          sub: 'Research Problem · 6 claims',
        },
        {
          kind: 'paper' as const,
          id: 'P18',
          label: 'LongMemBench v2',
          sub: 'Paper · ICLR 2025 · 2 claims',
        },
      ]

  return (
    <div className="page workspace">
      <SnapshotBanner />
      <section className="workspace-head">
        <div className="workspace-head-main">
          <div className="eyebrow">Research Workspace · Agent Memory</div>
          <h1>Agent Memory</h1>
          <p className="lede small">
            Explore active research questions, trace how claims are supported or contested,
            and validate candidate gaps against the original evidence.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => navigate('landscape')}>
              Open research landscape <ArrowRight size={15} />
            </button>
            <button className="btn" onClick={() => openTimeline()}>
              Knowledge timeline
            </button>
            <button className="search-hero small" onClick={() => setSearchOpen(true)}>
              <Search size={14} />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
          </div>
        </div>
        <div className="workspace-side">
          <div className="domain-line">
            <span className="live-dot" />
            <b>Agent Memory</b>
            <span>Active domain</span>
          </div>
          <div className="workspace-stats">
            <div><b>{snap.papers.length}</b><span>papers</span></div>
            <div><b>{snap.claims.length}</b><span>claims</span></div>
            <div><b>{snap.relations.length}</b><span>relations</span></div>
            <div><b>{snap.events.length}</b><span>updates</span></div>
          </div>
          <div className="preview-domains">
            <span>Preview</span>
            <button onClick={() => setToast('Long-context Reasoning has not been ingested yet.')}>
              Long-context Reasoning
            </button>
            <button onClick={() => setToast('Tool-use Agents has not been ingested yet.')}>
              Tool-use Agents
            </button>
          </div>
        </div>
      </section>

      <div className="ws-grid">
        <section className="ws-block">
          <div className="section-head">
            <h2>Research Questions</h2>
            <button className="text-link" onClick={() => navigate('landscape')}>
              Landscape <ArrowRight size={13} />
            </button>
          </div>
          <div className="question-list">
            {questions.map(({ problem, claims, contested, topic }) => (
              <button
                key={problem.id}
                className="question-row"
                onClick={() => openMatrix(problem.id)}
              >
                <div className="question-top">
                  <span className="topic-tag">
                    <i style={{ background: topic.color }} />
                    {topic.name}
                  </span>
                  <span className="muted small">
                    {claims.length} claims
                    {contested > 0 && ` · ${contested} contested`}
                  </span>
                </div>
                <div className="question-text">{problem.question}</div>
                <div className="question-status">
                  {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((s) => {
                    const n = claims.filter((c) => snap.states[c.id] === s).length
                    return n ? (
                      <span key={s}>
                        <i style={{ background: STATUS_COLORS[s] }} />
                        {n}
                      </span>
                    ) : null
                  })}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="ws-block">
          <div className="section-head">
            <h2>Recent Knowledge Updates</h2>
            <button className="text-link" onClick={() => openTimeline()}>
              Timeline <ArrowRight size={13} />
            </button>
          </div>
          <div className="event-list compact">
            {events.map((e) => {
              const claim = claimById[e.claimId]
              const paper = paperById[e.triggerPaperId]
              return (
                <button
                  key={e.id}
                  className="event-row"
                  onClick={() => openTimeline(decimalYear(e.time), e.id)}
                >
                  <div className="event-date">
                    <b>{timeLabel(decimalYear(e.time))}</b>
                    <span>{e.verified ? 'verified' : 'unreviewed'}</span>
                  </div>
                  <div className="event-main">
                    <div className="event-states">
                      <span className="state-dot" style={{ background: STATUS_COLORS[e.from] }} />
                      {STATUS_LABELS[e.from]}
                      <span className="arrow">→</span>
                      <span className="state-dot" style={{ background: STATUS_COLORS[e.to] }} />
                      {STATUS_LABELS[e.to]}
                    </div>
                    <p>{claim.statement}</p>
                    <div className="event-sub">{paper.title}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="ws-block">
          <div className="section-head">
            <h2>Opportunities to Validate</h2>
            <button className="text-link" onClick={() => navigate('opportunities')}>
              All <ArrowRight size={13} />
            </button>
          </div>
          <div className="mini-op-list">
            {opportunities.map(({ o, status }) => (
              <button key={o.id} className="mini-op" onClick={() => openOpportunity(o.id)}>
                <div className="mini-op-top">
                  <span className="opp-type">{OPPORTUNITY_LABELS[o.type]}</span>
                  <span style={{ color: OPPORTUNITY_STATUS_COLORS[status] }}>● {status}</span>
                </div>
                <div className="mini-op-question">{o.question}</div>
                <div className="mini-op-meta">
                  {o.supportClaimIds.length} support · {o.counterClaimIds.length} counter
                </div>
              </button>
            ))}
            {opportunities.length === 0 && (
              <div className="muted small">No pending opportunities at this snapshot.</div>
            )}
          </div>
        </section>
      </div>

      <section className="ws-block continue-block">
        <div className="section-head">
          <h2>Continue Exploring</h2>
          <span className="section-note">Recent views in this demo session.</span>
        </div>
        <div className="continue-grid">
          {continueItems.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              className="continue-card"
              onClick={() => {
                if (item.kind === 'claim') inspect('claim', item.id)
                else if (item.kind === 'paper') inspect('paper', item.id)
                else openMatrix(item.id)
              }}
            >
              <span className="continue-kind">{item.kind}</span>
              <span className="continue-label">{item.label}</span>
              <span className="continue-sub">
                {item.kind === 'problem'
                  ? `Research Problem · ${snap.claims.filter((c) => c.problemId === item.id).length} claims`
                  : item.kind === 'claim'
                    ? `Claim · ${claimById[item.id]?.paperId ?? ''}`
                    : `Paper · ${paperById[item.id]?.venue ?? ''}`}
              </span>
              <ArrowUpRight size={14} className="continue-arrow" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

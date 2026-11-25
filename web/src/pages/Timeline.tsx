import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  DATA,
  TIME_MAX,
  TIME_MIN,
  claimById,
  compareSnapshots,
  countsByStatus,
  decimalYear,
  paperById,
  snapshotAt,
  timeLabel,
} from '../data/selectors'
import { useApp } from '../store'
import { STATUS_COLORS, STATUS_LABELS } from '../ui/labels'

const pct = (t: number) => ((t - TIME_MIN) / (TIME_MAX - TIME_MIN)) * 100

export function Timeline() {
  const time = useApp((s) => s.time)
  const setTime = useApp((s) => s.setTime)
  const playing = useApp((s) => s.playing)
  const setPlaying = useApp((s) => s.setPlaying)
  const speed = useApp((s) => s.speed)
  const setSpeed = useApp((s) => s.setSpeed)
  const compareA = useApp((s) => s.compareA)
  const compareB = useApp((s) => s.compareB)
  const setCompare = useApp((s) => s.setCompare)
  const inspect = useApp((s) => s.inspect)

  const snapshot = useMemo(() => snapshotAt(time), [time])
  const counts = useMemo(() => countsByStatus(snapshot.states), [snapshot])
  const events = useMemo(
    () => [...snapshot.events].sort((a, b) => decimalYear(b.time) - decimalYear(a.time)),
    [snapshot.events],
  )
  const baselineInfo = useMemo(() => {
    const prior = DATA.events
      .map((e) => decimalYear(e.time))
      .filter((t) => t < time - 0.0001)
      .sort((a, b) => a - b)
    return {
      baseline: prior.length ? prior[prior.length - 1] - 0.0001 : TIME_MIN,
      hasPrior: prior.length > 0,
    }
  }, [time])
  const delta = useMemo(
    () => compareSnapshots(snapshotAt(baselineInfo.baseline), snapshot),
    [baselineInfo.baseline, snapshot],
  )

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const now = useApp.getState().time
      const next = now + 0.02 * speed
      if (next >= TIME_MAX) {
        setTime(TIME_MAX)
        setPlaying(false)
      } else {
        setTime(next)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [playing, speed, setPlaying, setTime])

  const startReplay = () => {
    if (time >= TIME_MAX - 0.02) setTime(TIME_MIN)
    setPlaying(!playing)
  }

  const cmp =
    compareA !== null && compareB !== null
      ? compareSnapshots(snapshotAt(compareA), snapshotAt(compareB))
      : null

  return (
    <div className="page timeline-page">
      <div className="timeline-head">
        <div>
          <div className="eyebrow light">Knowledge Timeline</div>
          <h1>Time travel through the evidence base.</h1>
          <p className="lede light">
            拖动时间指针回到任意时刻，查看当时的论文、主张与知识状态；再对比两个时刻，
            看新证据如何改变已有结论。
          </p>
        </div>
        <div className="timeline-controls">
          <button className="btn light" onClick={startReplay}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {playing ? 'Pause' : 'Replay evolution'}
          </button>
          <button
            className="btn ghost-light"
            onClick={() => {
              setPlaying(false)
              setTime(TIME_MIN)
              setCompare('A', null)
              setCompare('B', null)
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <div className="speed">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                className={speed === s ? 'active' : ''}
                onClick={() => setSpeed(s)}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="timeline-grid">
        <section className="timeline-map">
          <div className="map-top">
            <span className="time-big">{timeLabel(time)}</span>
            <span className="muted-dark">
              {snapshot.papers.length} papers · {snapshot.claims.length} claims ·{' '}
              {snapshot.relations.length} relations
            </span>
          </div>
          <svg viewBox="0 0 100 100" className="timeline-svg">
            <defs>
              <pattern id="tdots" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="0.5" cy="0.5" r="0.15" fill="#2a2c30" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#tdots)" />
            {DATA.topics.map((t) => (
              <g key={t.id}>
                <ellipse
                  cx={t.center[0]}
                  cy={t.center[1]}
                  rx={14}
                  ry={11}
                  fill={t.color}
                  fillOpacity={0.05}
                />
                <text x={t.center[0]} y={t.center[1] - 12} textAnchor="middle" className="tl-topic">
                  {t.name}
                </text>
              </g>
            ))}
            {snapshot.claims.map((c) => {
              const state = snapshot.states[c.id]
              return (
                <circle
                  key={c.id}
                  cx={c.position[0]}
                  cy={c.position[1]}
                  r={1.1}
                  fill={state ? STATUS_COLORS[state] : '#666'}
                  opacity={0.92}
                  className="tl-point"
                  onClick={() => inspect('claim', c.id)}
                />
              )
            })}
          </svg>
          <div className="timeline-legend">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <span key={k}>
                <i style={{ background: STATUS_COLORS[k as keyof typeof STATUS_COLORS] }} />
                {v}
              </span>
            ))}
          </div>
        </section>

        <aside className="timeline-side">
          <div className="snapshot-card">
            <div className="mini-title light">Snapshot</div>
            <div className="snapshot-counts">
              <div><b>{snapshot.papers.length}</b><span>Papers</span></div>
              <div><b>{snapshot.claims.length}</b><span>Claims</span></div>
              <div><b>{snapshot.relations.length}</b><span>Relations</span></div>
            </div>
            <div className="delta-strip">
              <span className="delta-label">
                {baselineInfo.hasPrior ? 'Since last update' : 'Since start'}
              </span>
              <span className="delta plus">+{delta.addedClaims.length} claims</span>
              <span className="delta minus">−{delta.removedClaims.length} claims</span>
              <span className="delta state">{delta.stateChanges.length} state changes</span>
            </div>
            <div className="status-bars">
              {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((s) => {
                const n = counts[s] ?? 0
                const max = Math.max(1, ...Object.values(counts))
                return (
                  <div className="status-bar-row" key={s}>
                    <span>{STATUS_LABELS[s]}</span>
                    <div className="bar">
                      <i
                        style={{
                          width: `${(n / max) * 100}%`,
                          background: STATUS_COLORS[s],
                        }}
                      />
                    </div>
                    <b>{n}</b>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="event-feed">
            <div className="mini-title light">Updates up to {timeLabel(time)}</div>
            {events.slice(0, 8).map((e) => {
              const claim = claimById[e.claimId]
              return (
                <button
                  key={e.id}
                  className="feed-event"
                  onClick={() => {
                    setTime(decimalYear(e.time))
                    inspect('event', e.id)
                  }}
                >
                  <span className="feed-date">{timeLabel(decimalYear(e.time))}</span>
                  <span className="feed-text">{claim.statement}</span>
                  <span className="feed-state">
                    {STATUS_LABELS[e.from]} → {STATUS_LABELS[e.to]}
                  </span>
                </button>
              )
            })}
            {events.length === 0 && (
              <div className="muted-dark small">No knowledge updates before this point.</div>
            )}
          </div>
        </aside>
      </div>

      <div className="scrubber">
        <div className="scrubber-head">
          <div className="compare-controls">
            <button
              className={`chip-btn ${compareA !== null ? 'set' : ''}`}
              onClick={() => setCompare('A', time)}
            >
              {compareA !== null ? `A · ${timeLabel(compareA)}` : 'Set A'}
            </button>
            <button
              className={`chip-btn ${compareB !== null ? 'set' : ''}`}
              onClick={() => setCompare('B', time)}
            >
              {compareB !== null ? `B · ${timeLabel(compareB)}` : 'Set B'}
            </button>
            {compareA !== null && compareB !== null && (
              <button
                className="chip-btn"
                onClick={() => {
                  setCompare('A', null)
                  setCompare('B', null)
                }}
              >
                Clear
              </button>
            )}
            <span className="muted-dark small">
              Click Set A / Set B at two moments. State changes count claims present in both
              snapshots.
            </span>
          </div>
          <span className="time-big small">{timeLabel(time)}</span>
        </div>

        <div className="range-wrap">
          <input
            type="range"
            min={TIME_MIN}
            max={TIME_MAX}
            step={0.005}
            value={time}
            onChange={(e) => {
              setPlaying(false)
              setTime(Number(e.target.value))
            }}
          />
          <div className="event-ticks">
            {DATA.events.map((e) => (
              <button
                key={e.id}
                className="tick"
                style={{ left: `${pct(decimalYear(e.time))}%` }}
                title={`${timeLabel(decimalYear(e.time))} · ${e.reason}`}
                onClick={() => {
                  setTime(decimalYear(e.time))
                  inspect('event', e.id)
                }}
              />
            ))}
          </div>
          <div className="range-labels">
            {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
              <span key={y} style={{ left: `${pct(y)}%` }}>{y}</span>
            ))}
          </div>
        </div>
      </div>

      {cmp && (
        <div className="compare-panel">
          <div className="compare-head">
            <div>
              <div className="eyebrow light">Compare moments</div>
              <h3>
                {timeLabel(cmp.from)} <span className="muted-dark">→</span> {timeLabel(cmp.to)}
              </h3>
            </div>
            <div className="compare-counts">
              <span>+{cmp.addedPapers.length} papers</span>
              <span>+{cmp.addedClaims.length} claims</span>
              <span>+{cmp.addedRelations.length} relations</span>
              <span>−{cmp.removedClaims.length} removed</span>
              <span>{cmp.stateChanges.length} state changes</span>
            </div>
          </div>
          <div className="compare-lists">
            <div>
              <div className="mini-title light">New papers</div>
              {cmp.addedPapers.slice(0, 5).map((p) => (
                <button key={p.id} className="compare-row" onClick={() => inspect('paper', p.id)}>
                  <span className="mono">{p.id}</span>
                  <span>{p.title}</span>
                  <span className="muted-dark">{p.ingestedAt}</span>
                </button>
              ))}
              {cmp.addedPapers.length === 0 && <div className="muted-dark small">None</div>}
            </div>
            <div>
              <div className="mini-title light">Knowledge state changes</div>
              {cmp.stateChanges.slice(0, 5).map((ch) => (
                <button
                  key={ch.claim.id}
                  className="compare-row"
                  onClick={() => inspect('claim', ch.claim.id)}
                >
                  <span className="mono">{ch.claim.id}</span>
                  <span>{ch.claim.statement}</span>
                  <span className="muted-dark">
                    {STATUS_LABELS[ch.from]} → {STATUS_LABELS[ch.to]}
                  </span>
                </button>
              ))}
              {cmp.stateChanges.length === 0 && <div className="muted-dark small">None</div>}
            </div>
          </div>
          <div className="compare-removed">
            Removed in this interval: {cmp.removedClaims.length} claims ·{' '}
            {cmp.removedPapers.length} papers · {cmp.removedRelations.length} relations.
            This demo has no retractions, so removals stay at zero.
          </div>
        </div>
      )}

      <div className="timeline-footnote">
        Publication time, ingestion time, and knowledge-update time are distinct. Click an
        update to inspect all three.
      </div>
    </div>
  )
}

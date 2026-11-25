import { Maximize2, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DATA,
  claimById,
  claimsForPaper,
  evidenceForClaim,
  paperById,
  problemById,
  problemsForTopic,
  snapshotAt,
} from '../data/selectors'
import type { Claim, Paper, Relation } from '../data/types'
import { useApp } from '../store'
import { SnapshotBanner } from '../components/SnapshotBanner'
import {
  RELATION_COLORS,
  RELATION_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../ui/labels'

interface Transform {
  x: number
  y: number
  k: number
}

type Layer = 'similarity' | 'evidence' | 'temporal'

const LAYERS: Array<{ id: Layer; label: string; hint: string }> = [
  {
    id: 'similarity',
    label: 'Semantic Similarity',
    hint: 'Regions group claims by topic. Proximity is not evidence.',
  },
  {
    id: 'evidence',
    label: 'Evidence Relations',
    hint: 'Lines are explicit Claim relations, colored by relation type.',
  },
  {
    id: 'temporal',
    label: 'Temporal Evolution',
    hint: 'Color shows publication year; position remains semantic.',
  },
]

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026]
const YEAR_COLORS: Record<number, string> = {
  2021: '#C8D3DE',
  2022: '#A9BACD',
  2023: '#86A0BE',
  2024: '#6286AF',
  2025: '#3E6A9F',
  2026: '#1F4E8C',
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: [number, number][] = []
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function expand(points: [number, number][], factor = 1.14): [number, number][] {
  if (!points.length) return points
  const cx = points.reduce((a, p) => a + p[0], 0) / points.length
  const cy = points.reduce((a, p) => a + p[1], 0) / points.length
  return points.map((p) => [cx + (p[0] - cx) * factor, cy + (p[1] - cy) * factor])
}

function hullPath(points: [number, number][]): string {
  if (points.length < 3) return ''
  return 'M' + points.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L ') + ' Z'
}

export function Landscape() {
  const mode = useApp((s) => s.landscapeMode)
  const setMode = useApp((s) => s.setLandscapeMode)
  const layer = useApp((s) => s.landscapeLayer)
  const setLayer = useApp((s) => s.setLandscapeLayer)
  const selectedTopic = useApp((s) => s.selectedTopicId)
  const setTopic = useApp((s) => s.setTopic)
  const filters = useApp((s) => s.filters)
  const setFilter = useApp((s) => s.setFilter)
  const inspect = useApp((s) => s.inspect)
  const openMatrixForTopic = useApp((s) => s.openMatrixForTopic)
  const openMatrix = useApp((s) => s.openMatrix)
  const pushRecent = useApp((s) => s.pushRecent)
  const inspector = useApp((s) => s.inspector)
  const time = useApp((s) => s.time)

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const [since, setSince] = useState(2021)
  const [hover, setHover] = useState<{
    x: number
    y: number
    kicker: string
    title: string
    detail: string
  } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)

  const snap = useMemo(() => snapshotAt(time), [time])

  useEffect(() => {
    if (!selectedTopic) {
      setTransform({ x: 0, y: 0, k: 1 })
      return
    }
    const t = DATA.topics.find((x) => x.id === selectedTopic)
    if (!t) return
    const k = 1.65
    setTransform({ k, x: 50 - t.center[0] * k, y: 50 - t.center[1] * k })
  }, [selectedTopic])

  const statusOf = (c: Claim) => snap.states[c.id] ?? c.status
  const topicOf = (c: Claim) => problemById[c.problemId].topicId
  const yearFilter = (c: Claim) => paperById[c.paperId].year >= since
  const statusFilter = (c: Claim) =>
    filters.status === 'all' || statusOf(c) === filters.status
  const baseFilter = (c: Claim) => yearFilter(c) && statusFilter(c)

  const visibleClaims = snap.claims.filter(baseFilter)
  const visibleIds = new Set(visibleClaims.map((c) => c.id))
  const showEdges = mode === 'relation' || layer === 'evidence'

  const relations = snap.relations.filter(
    (r) =>
      visibleIds.has(r.sourceId) &&
      visibleIds.has(r.targetId) &&
      (filters.relation === 'all' || r.type === filters.relation),
  )

  const paperPoints = useMemo(() => {
    const list: Array<{ paper: Paper; x: number; y: number }> = []
    for (const p of snap.papers) {
      if (p.year < since) continue
      const cs = claimsForPaper(p.id).filter((c) => snap.states[c.id])
      if (!cs.length) continue
      if (filters.status !== 'all' && !cs.some((c) => statusOf(c) === filters.status)) continue
      const x = cs.reduce((a, c) => a + c.position[0], 0) / cs.length
      const y = cs.reduce((a, c) => a + c.position[1], 0) / cs.length
      list.push({ paper: p, x, y })
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, since, filters.status])

  const focus = inspector?.type === 'claim' ? claimById[inspector.id] : null
  const focusAvailable = focus && visibleIds.has(focus.id) ? focus : null
  const neighborIds = useMemo(() => {
    const set = new Set<string>()
    if (!focusAvailable) return set
    set.add(focusAvailable.id)
    for (const r of relations) {
      if (r.sourceId === focusAvailable.id) set.add(r.targetId)
      if (r.targetId === focusAvailable.id) set.add(r.sourceId)
    }
    return set
  }, [focusAvailable, relations])

  const paperEdges = useMemo(() => {
    if (mode !== 'paper' || !showEdges) return []
    const pos: Record<string, [number, number]> = {}
    for (const pp of paperPoints) pos[pp.paper.id] = [pp.x, pp.y]
    const map = new Map<string, { a: string; b: string; count: number; type: Relation['type'] }>()
    for (const r of relations) {
      const pa = claimById[r.sourceId].paperId
      const pb = claimById[r.targetId].paperId
      if (pa === pb || !pos[pa] || !pos[pb]) continue
      const key = [pa, pb].sort().join('|')
      const cur = map.get(key)
      if (cur) cur.count += 1
      else map.set(key, { a: pa, b: pb, count: 1, type: r.type })
    }
    return [...map.values()]
  }, [mode, showEdges, relations, paperPoints])

  const hulls = useMemo(() => {
    return DATA.topics
      .map((t) => {
        const pts = snap.claims
          .filter((c) => topicOf(c) === t.id)
          .map((c) => c.position as [number, number])
        if (pts.length < 3) return { topic: t, points: [] as [number, number][] }
        return { topic: t, points: expand(convexHull(pts)) }
      })
      .filter((h) => h.points.length >= 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap])

  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const m = svg.getScreenCTM()!
    const p = pt.matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      const p = toSvg(e.clientX, e.clientY)
      const factor = Math.exp(-e.deltaY * 0.0012)
      setTransform((t) => {
        const k = Math.max(0.8, Math.min(4.5, t.k * factor))
        const ratio = k / t.k
        return { k, x: p.x - (p.x - t.x) * ratio, y: p.y - (p.y - t.y) * ratio }
      })
    }
    el.addEventListener('wheel', onWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', onWheelNative)
  }, [])

  const zoomBy = (factor: number) => {
    setTransform((t) => {
      const k = Math.max(0.8, Math.min(4.5, t.k * factor))
      const ratio = k / t.k
      const px = 50
      const py = 50
      return { k, x: px - (px - t.x) * ratio, y: py - (py - t.y) * ratio }
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = toSvg(e.clientX, e.clientY)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = toSvg(e.clientX, e.clientY)
    const dx = p.x - drag.current.x
    const dy = p.y - drag.current.y
    drag.current = p
    setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }
  const endDrag = () => {
    drag.current = null
  }

  const showTip = (
    e: React.PointerEvent,
    kicker: string,
    title: string,
    detail: string,
  ) => {
    const rect = (e.currentTarget.ownerSVGElement!.parentElement as HTMLElement).getBoundingClientRect()
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, kicker, title, detail })
  }

  const topic = selectedTopic ? DATA.topics.find((t) => t.id === selectedTopic) : null
  const topicProblems = topic ? problemsForTopic(topic.id) : []
  const topicClaims = topic ? snap.claims.filter((c) => topicOf(c) === topic.id) : []

  const pointDim = (claim: Claim) => {
    if (focusAvailable) return !neighborIds.has(claim.id)
    return !!selectedTopic && topicOf(claim) !== selectedTopic
  }

  const claimFill = (c: Claim) =>
    layer === 'temporal' ? YEAR_COLORS[paperById[c.paperId].year] ?? '#888' : STATUS_COLORS[statusOf(c)]

  return (
    <div className="page landscape-page">
      <SnapshotBanner />
      <div className="page-head">
        <div>
          <div className="eyebrow">Research Landscape</div>
          <h1>Map the field before reading the papers.</h1>
          <p className="lede small">
            A 2D semantic projection. Regions group topics; only explicit relation lines
            represent evidence links.
          </p>
        </div>
        <div className="segmented">
          {[
            ['claim', 'Claim View'],
            ['paper', 'Paper View'],
            ['relation', 'Relation View'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={mode === value ? 'active' : ''}
              onClick={() => setMode(value as typeof mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="layer-bar">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            className={`layer-card ${layer === l.id ? 'active' : ''}`}
            onClick={() => setLayer(l.id)}
          >
            <b>{l.label}</b>
            <span>{l.hint}</span>
          </button>
        ))}
      </div>

      <div className="landscape-controls">
        <div className="control-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilter({ status: e.target.value as typeof filters.status })}
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Relation</label>
          <select
            value={filters.relation}
            onChange={(e) =>
              setFilter({ relation: e.target.value as typeof filters.relation })
            }
            disabled={!showEdges}
          >
            <option value="all">All relations</option>
            {Object.keys(RELATION_COLORS).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Since</label>
          <select value={since} onChange={(e) => setSince(Number(e.target.value))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="zoom-controls">
          <button className="icon-btn" onClick={() => zoomBy(1.25)} title="Zoom in">
            <Plus size={15} />
          </button>
          <button className="icon-btn" onClick={() => zoomBy(0.8)} title="Zoom out">
            <Minus size={15} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
            title="Reset view"
          >
            <Maximize2 size={15} />
          </button>
        </div>
        <div className="control-meta">
          {visibleClaims.length} claims · {paperPoints.length} papers
        </div>
      </div>

      <div className="landscape-body">
        <div className="map-shell">
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="map-svg"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <defs>
              <pattern id="dotgrid" width="4" height="4" patternUnits="userSpaceOnUse">
                <circle cx="0.5" cy="0.5" r="0.18" fill="#dbd7ce" />
              </pattern>
            </defs>
            <rect x="-50" y="-50" width="200" height="200" fill="url(#dotgrid)" />
            <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
              {hulls.map(({ topic: t, points }) => {
                const dim = selectedTopic && selectedTopic !== t.id
                const strong = layer === 'similarity'
                return (
                  <g
                    key={t.id}
                    opacity={dim ? 0.18 : 1}
                    onClick={(e) => {
                      e.stopPropagation()
                      setTopic(selectedTopic === t.id ? null : t.id)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <path
                      d={hullPath(points)}
                      fill={t.color}
                      fillOpacity={selectedTopic === t.id ? 0.12 : strong ? 0.06 : 0.03}
                      stroke={t.color}
                      strokeOpacity={selectedTopic === t.id ? 0.35 : 0.12}
                      strokeWidth={0.18}
                      strokeDasharray={selectedTopic === t.id ? '0' : '0.8 0.8'}
                    />
                  </g>
                )
              })}

              {showEdges &&
                relations.map((r) => {
                  const a = claimById[r.sourceId].position
                  const b = claimById[r.targetId].position
                  const connectedFocus =
                    focusAvailable &&
                    (r.sourceId === focusAvailable.id || r.targetId === focusAvailable.id)
                  const dimTopic =
                    selectedTopic &&
                    (topicOf(claimById[r.sourceId]) !== selectedTopic ||
                      topicOf(claimById[r.targetId]) !== selectedTopic)
                  return (
                    <line
                      key={r.id}
                      x1={a[0]}
                      y1={a[1]}
                      x2={b[0]}
                      y2={b[1]}
                      stroke={RELATION_COLORS[r.type]}
                      strokeWidth={connectedFocus ? 0.38 : 0.2}
                      opacity={
                        focusAvailable
                          ? connectedFocus
                            ? 0.9
                            : 0.05
                          : dimTopic
                            ? 0.05
                            : 0.42
                      }
                    />
                  )
                })}

              {mode === 'paper' &&
                showEdges &&
                paperEdges.map((e) => {
                  const a = paperPoints.find((p) => p.paper.id === e.a)
                  const b = paperPoints.find((p) => p.paper.id === e.b)
                  if (!a || !b) return null
                  const focusPaper = focusAvailable?.paperId
                  const active = focusPaper && (e.a === focusPaper || e.b === focusPaper)
                  return (
                    <line
                      key={`${e.a}-${e.b}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={RELATION_COLORS[e.type]}
                      strokeWidth={0.15 + Math.min(e.count, 4) * 0.06}
                      opacity={focusPaper ? (active ? 0.8 : 0.04) : 0.25}
                    />
                  )
                })}

              {(mode === 'claim' || mode === 'relation') &&
                snap.claims.map((c) => {
                  if (!baseFilter(c)) return null
                  const dim = pointDim(c)
                  const isFocus = focusAvailable?.id === c.id
                  const isNeighbor = neighborIds.has(c.id)
                  return (
                    <circle
                      key={c.id}
                      cx={c.position[0]}
                      cy={c.position[1]}
                      r={isFocus ? 1.85 : dim ? 0.7 : 1.2}
                      fill={claimFill(c)}
                      stroke={isFocus ? '#1b1a17' : 'none'}
                      strokeWidth={isFocus ? 0.28 : 0}
                      opacity={dim ? 0.15 : 1}
                      onPointerEnter={(e) =>
                        showTip(
                          e,
                          `Claim · ${c.id}`,
                          c.statement,
                          `${paperById[c.paperId].year} · ${paperById[c.paperId].venue} · ${STATUS_LABELS[statusOf(c)]} · ${evidenceForClaim(c.id).length} evidence`,
                        )
                      }
                      onPointerLeave={() => setHover(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        inspect('claim', c.id)
                        if (isNeighbor) setHover(null)
                        pushRecent({
                          kind: 'claim',
                          id: c.id,
                          label: c.statement,
                          sub: `Claim · ${c.paperId}`,
                        })
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}

              {mode === 'paper' &&
                paperPoints.map(({ paper, x, y }) => {
                  const dim = selectedTopic && paper.topicId !== selectedTopic
                  const focusPaper = focusAvailable?.paperId === paper.id
                  return (
                    <circle
                      key={paper.id}
                      cx={x}
                      cy={y}
                      r={focusPaper ? 2.1 : dim ? 1 : 1.6}
                      fill={
                        layer === 'temporal'
                          ? YEAR_COLORS[paper.year] ?? '#242321'
                          : '#242321'
                      }
                      stroke={focusPaper ? '#1b1a17' : 'none'}
                      strokeWidth={focusPaper ? 0.3 : 0}
                      opacity={dim ? 0.15 : 0.88}
                      onPointerEnter={(e) =>
                        showTip(
                          e,
                          `Paper · ${paper.id}`,
                          paper.title,
                          `${paper.venue} · ${paper.year} · ${claimsForPaper(paper.id).length} claims`,
                        )
                      }
                      onPointerLeave={() => setHover(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        inspect('paper', paper.id)
                        pushRecent({
                          kind: 'paper',
                          id: paper.id,
                          label: paper.title,
                          sub: `Paper · ${paper.venue}`,
                        })
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}

              <g>
                {DATA.topics.map((t) => {
                  const dim = selectedTopic && selectedTopic !== t.id
                  return (
                    <text
                      key={t.id}
                      x={t.center[0]}
                      y={t.center[1] - 11.5}
                      textAnchor="middle"
                      className="map-topic-label"
                      fill={selectedTopic === t.id ? '#1d1d1f' : '#5c584f'}
                      opacity={dim ? 0.3 : 1}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTopic(selectedTopic === t.id ? null : t.id)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {t.name}
                    </text>
                  )
                })}
              </g>
            </g>
          </svg>

          {hover && (
            <div
              className="map-tooltip"
              style={{ left: Math.min(hover.x + 14, 420), top: hover.y + 14 }}
            >
              <div className="tooltip-kicker">{hover.kicker}</div>
              <div className="tooltip-title">{hover.title}</div>
              <div className="tooltip-detail">{hover.detail}</div>
            </div>
          )}

          <div className="map-note">
            {layer === 'similarity' &&
              'Regions are semantic topic clusters. Proximity does not mean support or causation.'}
            {layer === 'evidence' &&
              'Lines are explicit Claim relations. Use the Evidence Matrix for judgement details.'}
            {layer === 'temporal' &&
              'Color encodes publication year. Position is semantic, not chronological.'}
          </div>
        </div>

        {topic && (
          <aside className="topic-panel">
            <div className="eyebrow">Topic · {topic.id}</div>
            <h2>{topic.name}</h2>
            <p>{topic.description}</p>
            <div className="topic-stats">
              <span>{topicClaims.length} claims at this time</span>
              <span>{snap.papers.filter((p) => p.topicId === topic.id).length} papers</span>
            </div>
            <div className="topic-problems">
              <div className="mini-title">Research Problems</div>
              {topicProblems.map((p) => (
                <button key={p.id} className="topic-problem" onClick={() => openMatrix(p.id)}>
                  <span>{p.question}</span>
                  <span className="count">
                    {snap.claims.filter((c) => c.problemId === p.id).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="ins-actions">
              <button className="btn primary" onClick={() => openMatrixForTopic(topic.id)}>
                Open all {topicClaims.length} claims in Matrix
              </button>
            </div>
          </aside>
        )}
      </div>

      <div className="map-legend">
        {layer === 'temporal'
          ? YEARS.map((y) => (
              <span key={y}>
                <i style={{ background: YEAR_COLORS[y] }} />
                {y}
              </span>
            ))
          : Object.entries(STATUS_LABELS).map(([k, v]) => (
              <span key={k}>
                <i style={{ background: STATUS_COLORS[k as keyof typeof STATUS_COLORS] }} />
                {v}
              </span>
            ))}
        {showEdges &&
          (Object.keys(RELATION_LABELS) as Array<keyof typeof RELATION_LABELS>).map((k) => (
            <span key={k}>
              <i style={{ background: RELATION_COLORS[k], borderRadius: 1 }} />
              {RELATION_LABELS[k]}
            </span>
          ))}
      </div>
    </div>
  )
}

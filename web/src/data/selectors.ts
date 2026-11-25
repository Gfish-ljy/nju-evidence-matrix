import { DEMO } from './demo'
import type {
  Claim,
  Evidence,
  KnowledgeEvent,
  KnowledgeStatus,
  Paper,
  Problem,
  Relation,
  Topic,
} from './types'

export const DATA = DEMO

export const paperById: Record<string, Paper> = Object.fromEntries(
  DATA.papers.map((p) => [p.id, p]),
)
export const claimById: Record<string, Claim> = Object.fromEntries(
  DATA.claims.map((c) => [c.id, c]),
)
export const problemById: Record<string, Problem> = Object.fromEntries(
  DATA.problems.map((p) => [p.id, p]),
)
export const topicById: Record<string, Topic> = Object.fromEntries(
  DATA.topics.map((t) => [t.id, t]),
)
export const relationById: Record<string, Relation> = Object.fromEntries(
  DATA.relations.map((r) => [r.id, r]),
)
export const eventById: Record<string, KnowledgeEvent> = Object.fromEntries(
  DATA.events.map((e) => [e.id, e]),
)

export const decimalYear = (iso: string): number => {
  const d = new Date(iso + 'T00:00:00Z')
  return (
    d.getUTCFullYear() +
    (d.getUTCMonth() + Math.min(d.getUTCDate() - 1, 27) / 28) / 12
  )
}

export const TIME_MIN = decimalYear('2021-01-01')
export const TIME_MAX = decimalYear('2027-01-01')

export const timeLabel = (t: number): string => {
  const year = Math.floor(t)
  const month = Math.min(12, Math.max(1, Math.round((t - year) * 12) + 1))
  return `${year}-${String(month).padStart(2, '0')}`
}

export function stateAt(claim: Claim, time: number): KnowledgeStatus | null {
  if (decimalYear(claim.createdAt) > time) return null
  const events = DATA.events
    .filter((e) => e.claimId === claim.id && decimalYear(e.time) <= time)
    .sort((a, b) => decimalYear(a.time) - decimalYear(b.time))
  if (events.length === 0) return claim.initialStatus
  return events[events.length - 1].to
}

export function evidenceForClaim(claimId: string): Evidence[] {
  return DATA.evidence.filter((e) => e.claimId === claimId)
}

export function claimsForProblem(problemId: string): Claim[] {
  return DATA.claims.filter((c) => c.problemId === problemId)
}

export function claimsForPaper(paperId: string): Claim[] {
  return DATA.claims.filter((c) => c.paperId === paperId)
}

export function relationsForClaim(claimId: string): Relation[] {
  return DATA.relations.filter(
    (r) => r.sourceId === claimId || r.targetId === claimId,
  )
}

export function relationBetween(a: string, b: string): Relation | undefined {
  return DATA.relations.find(
    (r) =>
      (r.sourceId === a && r.targetId === b) ||
      (r.sourceId === b && r.targetId === a),
  )
}

export function topicForProblem(problemId: string): Topic {
  return topicById[problemById[problemId].topicId]
}

export function problemsForTopic(topicId: string): Problem[] {
  return DATA.problems.filter((p) => p.topicId === topicId)
}

export function paperForClaim(claim: Claim): Paper {
  return paperById[claim.paperId]
}

export function claimStateAt(claimId: string, time: number) {
  return stateAt(claimById[claimId], time)
}

export interface Snapshot {
  time: number
  papers: Paper[]
  claims: Claim[]
  relations: Relation[]
  states: Record<string, KnowledgeStatus>
  events: KnowledgeEvent[]
}

export function snapshotAt(time: number): Snapshot {
  const papers = DATA.papers.filter((p) => decimalYear(p.ingestedAt) <= time)
  const paperIds = new Set(papers.map((p) => p.id))
  const claims = DATA.claims.filter(
    (c) => paperIds.has(c.paperId) && decimalYear(c.createdAt) <= time,
  )
  const claimIds = new Set(claims.map((c) => c.id))
  const relations = DATA.relations.filter(
    (r) =>
      decimalYear(r.createdAt) <= time &&
      claimIds.has(r.sourceId) &&
      claimIds.has(r.targetId),
  )
  const states: Record<string, KnowledgeStatus> = {}
  for (const c of claims) {
    const s = stateAt(c, time)
    if (s) states[c.id] = s
  }
  const events = DATA.events.filter((e) => decimalYear(e.time) <= time)
  return { time, papers, claims, relations, states, events }
}

export function countsByStatus(states: Record<string, KnowledgeStatus>) {
  const counts: Record<string, number> = {}
  for (const s of Object.values(states)) counts[s] = (counts[s] ?? 0) + 1
  return counts
}

export function latestEvents(limit = 6) {
  return [...DATA.events]
    .sort((a, b) => decimalYear(b.time) - decimalYear(a.time))
    .slice(0, limit)
}

export function compareSnapshots(a: Snapshot, b: Snapshot) {
  const [early, late] = a.time <= b.time ? [a, b] : [b, a]
  const earlyClaims = new Set(early.claims.map((c) => c.id))
  const earlyPapers = new Set(early.papers.map((p) => p.id))
  const earlyRelations = new Set(early.relations.map((r) => r.id))
  return {
    from: early.time,
    to: late.time,
    addedPapers: late.papers.filter((p) => !earlyPapers.has(p.id)),
    addedClaims: late.claims.filter((c) => !earlyClaims.has(c.id)),
    addedRelations: late.relations.filter((r) => !earlyRelations.has(r.id)),
    removedPapers: early.papers.filter((p) => !late.papers.some((x) => x.id === p.id)),
    removedClaims: early.claims.filter((c) => !late.claims.some((x) => x.id === c.id)),
    removedRelations: early.relations.filter((r) => !late.relations.some((x) => x.id === r.id)),
    stateChanges: late.claims
      .filter((c) => early.states[c.id] && early.states[c.id] !== late.states[c.id])
      .map((c) => ({
        claim: c,
        from: early.states[c.id] as KnowledgeStatus,
        to: late.states[c.id] as KnowledgeStatus,
      })),
  }
}

export function claimsForTopic(topicId: string): Claim[] {
  return DATA.claims.filter((c) => problemById[c.problemId].topicId === topicId)
}

export function isHistorical(time: number): boolean {
  return time < TIME_MAX - 0.02
}

export function claimsAt(time: number): Claim[] {
  return snapshotAt(time).claims
}

export function paperClaimsCount(paperId: string) {
  return claimsForPaper(paperId).length
}

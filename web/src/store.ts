import { create } from 'zustand'
import type {
  KnowledgeStatus,
  OpportunityStatus,
  Page,
  RelationType,
} from './data/types'
import { TIME_MAX, problemById, problemsForTopic, timeLabel } from './data/selectors'
import type { Page as AppPage } from './data/types'

export type InspectorType = 'claim' | 'paper' | 'relation' | 'event'
export type RecentKind = 'claim' | 'problem' | 'paper'

export interface RecentItem {
  kind: RecentKind
  id: string
  label: string
  sub: string
  at: number
}

export interface Filters {
  status: 'all' | KnowledgeStatus
  relation: 'all' | RelationType
}

interface AppState {
  page: Page
  selectedTopicId: string | null
  selectedProblemId: string | null
  selectedClaimId: string | null
  selectedOpportunityId: string | null
  inspector: { type: InspectorType; id: string } | null
  filters: Filters
  landscapeMode: 'paper' | 'claim' | 'relation'
  landscapeLayer: 'similarity' | 'evidence' | 'temporal'
  matrixMode: 'relations' | 'conditions'
  matrixScope: 'problem' | 'topic'
  matrixTopicId: string | null
  returnPage: Page
  selectedEvidenceId: string | null
  time: number
  compareA: number | null
  compareB: number | null
  playing: boolean
  speed: number
  opportunityStatus: Record<string, OpportunityStatus>
  recent: RecentItem[]
  searchOpen: boolean
  toast: string | null

  navigate: (page: Page) => void
  inspect: (type: InspectorType, id: string) => void
  closeInspector: () => void
  openExplorer: (claimId: string, evidenceId?: string | null) => void
  backFromExplorer: () => void
  openMatrix: (problemId?: string) => void
  openMatrixForTopic: (topicId: string) => void
  openLandscape: (topicId?: string) => void
  openTimeline: (time?: number, eventId?: string) => void
  openOpportunity: (id: string) => void
  setTopic: (id: string | null) => void
  setProblem: (id: string) => void
  setFilter: (patch: Partial<Filters>) => void
  setLandscapeMode: (mode: AppState['landscapeMode']) => void
  setLandscapeLayer: (layer: AppState['landscapeLayer']) => void
  setMatrixMode: (mode: AppState['matrixMode']) => void
  setTime: (t: number) => void
  resetTime: () => void
  setCompare: (slot: 'A' | 'B', t: number | null) => void
  setPlaying: (v: boolean) => void
  setSpeed: (v: number) => void
  setOpportunityStatus: (id: string, status: OpportunityStatus) => void
  pushRecent: (item: Omit<RecentItem, 'at'>) => void
  setSearchOpen: (v: boolean) => void
  setToast: (v: string | null) => void
}

const params = new URLSearchParams(window.location.search)
const initPage = (params.get('page') as AppPage) || 'workspace'
const initTime = params.get('time') ? Number(params.get('time')) : TIME_MAX
const initA = params.get('a') ? Number(params.get('a')) : null
const initB = params.get('b') ? Number(params.get('b')) : null
const inspectRaw = params.get('inspect')
const initInspector =
  inspectRaw && inspectRaw.includes(':')
    ? {
        type: inspectRaw.split(':')[0] as InspectorType,
        id: inspectRaw.split(':').slice(1).join(':'),
      }
    : null

export const useApp = create<AppState>((set, get) => ({
  page: initPage,
  selectedTopicId: params.get('topic'),
  selectedProblemId: params.get('problem') || 'P2',
  selectedClaimId: params.get('claim'),
  selectedOpportunityId: params.get('opp') || 'O1',
  inspector: initInspector,
  filters: { status: 'all', relation: 'all' },
  landscapeMode: 'claim',
  landscapeLayer: (params.get('layer') as AppState['landscapeLayer']) || 'similarity',
  matrixMode: 'relations',
  matrixScope: params.get('scope') === 'topic' ? 'topic' : 'problem',
  matrixTopicId: params.get('scope') === 'topic' ? params.get('topic') : null,
  returnPage: 'workspace',
  selectedEvidenceId: params.get('evidence'),
  time: initTime,
  compareA: initA,
  compareB: initB,
  playing: false,
  speed: 1,
  opportunityStatus: {},
  recent: [],
  searchOpen: false,
  toast: null,

  navigate: (page) => set({ page, inspector: null, searchOpen: false }),
  inspect: (type, id) => set({ inspector: { type, id } }),
  closeInspector: () => set({ inspector: null }),
  openExplorer: (claimId, evidenceId) =>
    set((s) => ({
      page: 'explorer',
      returnPage: s.page === 'explorer' ? s.returnPage : s.page,
      selectedClaimId: claimId,
      selectedEvidenceId: evidenceId ?? null,
      inspector: null,
    })),
  backFromExplorer: () =>
    set((s) => ({
      page: s.returnPage === 'explorer' ? 'matrix' : s.returnPage,
      inspector: null,
    })),
  openMatrix: (problemId) =>
    set((s) => {
      const id = problemId ?? s.selectedProblemId ?? 'P1'
      const p = problemById[id]
      const recent = p
        ? [
            {
              kind: 'problem' as const,
              id,
              label: p.question,
              sub: 'Research Problem',
              at: Date.now(),
            },
            ...s.recent.filter((r) => !(r.kind === 'problem' && r.id === id)),
          ].slice(0, 6)
        : s.recent
      return {
        page: 'matrix',
        matrixScope: 'problem',
        matrixTopicId: null,
        selectedProblemId: id,
        inspector: null,
        recent,
      }
    }),
  openMatrixForTopic: (topicId) =>
    set({
      page: 'matrix',
      matrixScope: 'topic',
      matrixTopicId: topicId,
      selectedTopicId: topicId,
      selectedProblemId: problemsForTopic(topicId)[0]?.id ?? 'P1',
      inspector: null,
    }),
  openLandscape: (topicId) =>
    set((s) => ({
      page: 'landscape',
      selectedTopicId: topicId ?? s.selectedTopicId,
      inspector: null,
    })),
  openTimeline: (time, eventId) =>
    set({
      page: 'timeline',
      time: time ?? get().time,
      inspector: eventId ? { type: 'event', id: eventId } : null,
    }),
  openOpportunity: (id) =>
    set({ page: 'opportunities', selectedOpportunityId: id, inspector: null }),
  setTopic: (id) => set({ selectedTopicId: id }),
  setProblem: (id) => set({ selectedProblemId: id, matrixScope: 'problem', matrixTopicId: null }),
  setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setLandscapeMode: (landscapeMode) => set({ landscapeMode }),
  setLandscapeLayer: (landscapeLayer) => set({ landscapeLayer }),
  setMatrixMode: (matrixMode) => set({ matrixMode }),
  setTime: (time) => set({ time }),
  resetTime: () => set({ time: TIME_MAX, playing: false }),
  setCompare: (slot, t) =>
    set(slot === 'A' ? { compareA: t } : { compareB: t }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setOpportunityStatus: (id, status) =>
    set((s) => ({
      opportunityStatus: { ...s.opportunityStatus, [id]: status },
      toast: `Opportunity marked as ${status}`,
    })),
  pushRecent: (item) =>
    set((s) => {
      const next = [
        { ...item, at: Date.now() },
        ...s.recent.filter((r) => !(r.kind === item.kind && r.id === item.id)),
      ].slice(0, 6)
      return { recent: next }
    }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setToast: (toast) => set({ toast }),
}))

export const timeText = timeLabel

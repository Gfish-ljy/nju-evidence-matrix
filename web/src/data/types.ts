export type Page =
  | 'workspace'
  | 'landscape'
  | 'matrix'
  | 'explorer'
  | 'timeline'
  | 'opportunities'

export type KnowledgeStatus =
  | 'Supported'
  | 'Contested'
  | 'Qualified'
  | 'WeaklySupported'
  | 'Superseded'
  | 'Unresolved'

export type RelationType =
  | 'Supports'
  | 'Contradicts'
  | 'Extends'
  | 'Refines'
  | 'Qualifies'
  | 'Supersedes'

export type OpportunityType = 'conflict' | 'condition-gap' | 'limitation'

export type OpportunityStatus =
  | 'Pending'
  | 'Validating'
  | 'Needs Validation'
  | 'Validated'
  | 'Rejected'

export interface Topic {
  id: string
  name: string
  description: string
  color: string
  center: [number, number]
}

export interface Problem {
  id: string
  topicId: string
  question: string
  description: string
}

export interface Paper {
  id: string
  title: string
  authors: string
  year: number
  venue: string
  abstract: string
  topicId: string
  publishedAt: string
  ingestedAt: string
  citations: number
}

export interface Condition {
  dataset: string
  model: string
  task: string
  metrics: string[]
  scale?: string
}

export interface Claim {
  id: string
  paperId: string
  problemId: string
  statement: string
  finding: string
  method: string
  condition: Condition
  limitation: string
  initialStatus: KnowledgeStatus
  status: KnowledgeStatus
  position: [number, number]
  createdAt: string
}

export interface Evidence {
  id: string
  claimId: string
  paperId: string
  section: string
  page: number
  quote: string
  stance: 'Support' | 'Contrast' | 'Background' | 'Method'
}

export interface Relation {
  id: string
  sourceId: string
  targetId: string
  type: RelationType
  confidence: number
  comparability: 'Comparable' | 'Partial' | 'Incomparable'
  rationale: string
  evidenceIds: string[]
  createdAt: string
}

export interface KnowledgeEvent {
  id: string
  claimId: string
  time: string
  from: KnowledgeStatus
  to: KnowledgeStatus
  triggerPaperId: string
  evidenceIds: string[]
  reason: string
  operator: string
  verified: boolean
}

export interface ValidationStep {
  label: string
  done: boolean
  note?: string
}

export interface Opportunity {
  id: string
  type: OpportunityType
  question: string
  basis: string
  problemId: string
  supportClaimIds: string[]
  counterClaimIds: string[]
  paperIds: string[]
  boundary: string
  suggestedValidation: string
  validation: ValidationStep[]
  status: OpportunityStatus
  discoveredAt: string
}

export interface DemoData {
  topics: Topic[]
  problems: Problem[]
  papers: Paper[]
  claims: Claim[]
  evidence: Evidence[]
  relations: Relation[]
  events: KnowledgeEvent[]
  opportunities: Opportunity[]
}

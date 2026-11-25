import type {
  KnowledgeStatus,
  OpportunityStatus,
  OpportunityType,
  RelationType,
} from '../data/types'

export const STATUS_COLORS: Record<KnowledgeStatus, string> = {
  Supported: '#3E8E5A',
  Contested: '#C4544E',
  Qualified: '#B7791F',
  WeaklySupported: '#4F7DBD',
  Superseded: '#8A8A8E',
  Unresolved: '#9A9A9E',
}

export const STATUS_LABELS: Record<KnowledgeStatus, string> = {
  Supported: 'Supported',
  Contested: 'Contested',
  Qualified: 'Qualified',
  WeaklySupported: 'Weakly Supported',
  Superseded: 'Superseded',
  Unresolved: 'Unresolved',
}

export const STATUS_LABELS_ZH: Record<KnowledgeStatus, string> = {
  Supported: '有证据支持',
  Contested: '存在冲突',
  Qualified: '条件受限',
  WeaklySupported: '弱支持',
  Superseded: '已被取代',
  Unresolved: '未决',
}

export const RELATION_COLORS: Record<RelationType, string> = {
  Supports: '#3E8E5A',
  Contradicts: '#C4544E',
  Extends: '#0A84FF',
  Refines: '#7C5CD6',
  Qualifies: '#B7791F',
  Supersedes: '#8A8A8E',
}

export const RELATION_LABELS: Record<RelationType, string> = {
  Supports: 'Supports',
  Contradicts: 'Contradicts',
  Extends: 'Extends',
  Refines: 'Refines',
  Qualifies: 'Qualifies',
  Supersedes: 'Supersedes',
}

export const RELATION_LABELS_ZH: Record<RelationType, string> = {
  Supports: '支持',
  Contradicts: '冲突',
  Extends: '扩展',
  Refines: '细化',
  Qualifies: '限定',
  Supersedes: '替代',
}

export const OPPORTUNITY_LABELS: Record<OpportunityType, string> = {
  conflict: 'Evidence Conflict',
  'condition-gap': 'Condition Gap',
  limitation: 'Limitation Connection',
}

export const OPPORTUNITY_STATUS_COLORS: Record<OpportunityStatus, string> = {
  Pending: '#8A8A8E',
  Validating: '#0A84FF',
  'Needs Validation': '#B7791F',
  Validated: '#3E8E5A',
  Rejected: '#C4544E',
}

export const TOPIC_COLORS = [
  '#0A84FF',
  '#3E8E5A',
  '#B7791F',
  '#7C5CD6',
  '#138F8A',
  '#C4544E',
]

import type { KnowledgeStatus, RelationType } from '../data/types'
import {
  RELATION_COLORS,
  RELATION_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../ui/labels'

export function StatusPill({
  status,
  small = false,
}: {
  status: KnowledgeStatus
  small?: boolean
}) {
  return (
    <span className={`status ${small ? 'small' : ''}`}>
      <i style={{ background: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function RelationPill({
  type,
  small = false,
}: {
  type: RelationType
  small?: boolean
}) {
  return (
    <span className={`status ${small ? 'small' : ''}`}>
      <i style={{ background: RELATION_COLORS[type] }} />
      {RELATION_LABELS[type]}
    </span>
  )
}

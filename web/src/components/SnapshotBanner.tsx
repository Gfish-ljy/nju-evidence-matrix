import { History, RotateCcw } from 'lucide-react'
import { TIME_MAX, timeLabel } from '../data/selectors'
import { useApp } from '../store'

export function SnapshotBanner() {
  const time = useApp((s) => s.time)
  const resetTime = useApp((s) => s.resetTime)
  const openTimeline = useApp((s) => s.openTimeline)
  if (time >= TIME_MAX - 0.02) return null

  return (
    <div className="snapshot-banner">
      <History size={15} />
      <span>
        Historical snapshot · <b>{timeLabel(time)}</b>
      </span>
      <span className="snapshot-note">
        All pages are showing papers, claims, and states available at this time.
      </span>
      <button className="text-link" onClick={() => openTimeline(time)}>
        Open timeline
      </button>
      <button className="chip-btn small" onClick={resetTime}>
        <RotateCcw size={12} /> Return to latest
      </button>
    </div>
  )
}

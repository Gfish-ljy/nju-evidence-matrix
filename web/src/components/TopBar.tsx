import { Command, Search } from 'lucide-react'
import type { Page } from '../data/types'
import { useApp } from '../store'

const PAGE_LABELS: Record<Page, string> = {
  workspace: 'Workspace',
  landscape: 'Research Landscape',
  matrix: 'Evidence Matrix',
  explorer: 'Evidence Explorer',
  timeline: 'Knowledge Timeline',
  opportunities: 'Research Opportunities',
}

export function TopBar() {
  const page = useApp((s) => s.page)
  const setSearchOpen = useApp((s) => s.setSearchOpen)

  return (
    <header className="topbar">
      <div className="crumbs">
        <span className="domain">Agent Memory</span>
        <span className="slash">/</span>
        <span className="current">{PAGE_LABELS[page]}</span>
      </div>
      <div className="top-actions">
        <button className="search-trigger" onClick={() => setSearchOpen(true)}>
          <Search size={15} strokeWidth={1.7} />
          <span>Search papers, claims, problems</span>
          <kbd>
            <Command size={11} /> K
          </kbd>
        </button>
        <span className="demo-tag">Demo data</span>
      </div>
    </header>
  )
}

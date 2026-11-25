import {
  Clock,
  Compass,
  FileText,
  Home,
  Lightbulb,
  Search,
  Table,
} from 'lucide-react'
import type { Page } from '../data/types'
import { DATA } from '../data/selectors'
import { useApp } from '../store'

const NAV: Array<{
  page: Page
  label: string
  icon: typeof Home
  section: string
}> = [
  { page: 'workspace', label: 'Workspace', icon: Home, section: 'Explore' },
  { page: 'landscape', label: 'Research Landscape', icon: Compass, section: 'Explore' },
  { page: 'matrix', label: 'Evidence Matrix', icon: Table, section: 'Analyze' },
  { page: 'explorer', label: 'Evidence Explorer', icon: FileText, section: 'Analyze' },
  { page: 'timeline', label: 'Knowledge Timeline', icon: Clock, section: 'Evolve' },
  { page: 'opportunities', label: 'Research Opportunities', icon: Lightbulb, section: 'Evolve' },
]

const SECTIONS = ['Explore', 'Analyze', 'Evolve']

export function Sidebar() {
  const page = useApp((s) => s.page)
  const navigate = useApp((s) => s.navigate)
  const setSearchOpen = useApp((s) => s.setSearchOpen)

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <div className="brand-copy">
          <b>EvidenceMatrix</b>
          <em>Research Intelligence</em>
        </div>
      </div>

      <button className="side-search" onClick={() => setSearchOpen(true)}>
        <Search size={15} strokeWidth={1.7} />
        <span>Search</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className="side-nav">
        {SECTIONS.map((section) => (
          <div className="nav-group" key={section}>
            <div className="nav-title">{section}</div>
            {NAV.filter((n) => n.section === section).map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.page}
                  className={`nav-item ${page === item.page ? 'active' : ''}`}
                  onClick={() => navigate(item.page)}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        <div className="domain-card" onClick={() => navigate('workspace')}>
          <div className="domain-dot" />
          <div>
            <b>Agent Memory</b>
            <span>
              {DATA.papers.length} papers · {DATA.claims.length} claims
            </span>
          </div>
        </div>
        <div className="side-note">MVP demo · mock data</div>
      </div>
    </aside>
  )
}

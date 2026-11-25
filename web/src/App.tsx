import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Inspector } from './components/Inspector'
import { SearchOverlay } from './components/SearchOverlay'
import { Toast } from './components/Toast'
import { Workspace } from './pages/Workspace'
import { Landscape } from './pages/Landscape'
import { Matrix } from './pages/Matrix'
import { Explorer } from './pages/Explorer'
import { Timeline } from './pages/Timeline'
import { Opportunities } from './pages/Opportunities'
import { useApp } from './store'

const PAGES = {
  workspace: Workspace,
  landscape: Landscape,
  matrix: Matrix,
  explorer: Explorer,
  timeline: Timeline,
  opportunities: Opportunities,
}

export default function App() {
  const page = useApp((s) => s.page)
  const inspector = useApp((s) => s.inspector)
  const closeInspector = useApp((s) => s.closeInspector)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useApp.getState().inspector) {
        closeInspector()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeInspector])

  const Page = PAGES[page]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="page-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>{inspector && <Inspector />}</AnimatePresence>
      <SearchOverlay />
      <Toast />
    </div>
  )
}

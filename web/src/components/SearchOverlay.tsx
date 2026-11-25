import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DATA } from '../data/selectors'
import { useApp } from '../store'

export function SearchOverlay() {
  const open = useApp((s) => s.searchOpen)
  const setOpen = useApp((s) => s.setSearchOpen)
  const inspect = useApp((s) => s.inspect)
  const openMatrix = useApp((s) => s.openMatrix)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const query = q.trim().toLowerCase()
  const claims = useMemo(
    () =>
      query
        ? DATA.claims
            .filter((c) => (c.statement + c.method + c.id).toLowerCase().includes(query))
            .slice(0, 6)
        : [],
    [query],
  )
  const papers = useMemo(
    () =>
      query
        ? DATA.papers
            .filter((p) => (p.title + p.abstract + p.id).toLowerCase().includes(query))
            .slice(0, 4)
        : [],
    [query],
  )
  const problems = useMemo(
    () =>
      query
        ? DATA.problems
            .filter((p) => (p.question + p.description).toLowerCase().includes(query))
            .slice(0, 4)
        : [],
    [query],
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="search-panel"
            initial={{ opacity: 0, y: -8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-input-row">
              <Search size={18} strokeWidth={1.6} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search claims, papers, research problems…"
              />
              <button className="icon-btn" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="search-results">
              {!query && (
                <div className="search-hint">
                  Try a topic, a claim, or a paper title. Results are linked to the
                  evidence graph.
                </div>
              )}
              {papers.length > 0 && (
                <div className="search-group">
                  <div className="group-label">Papers</div>
                  {papers.map((p) => (
                    <button
                      key={p.id}
                      className="result"
                      onClick={() => {
                        inspect('paper', p.id)
                        setOpen(false)
                      }}
                    >
                      <span className="result-id">{p.id}</span>
                      <span className="result-main">{p.title}</span>
                      <span className="result-sub">
                        {p.venue} · {p.year}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {claims.length > 0 && (
                <div className="search-group">
                  <div className="group-label">Claims</div>
                  {claims.map((c) => (
                    <button
                      key={c.id}
                      className="result"
                      onClick={() => {
                        inspect('claim', c.id)
                        setOpen(false)
                      }}
                    >
                      <span className="result-id">{c.id}</span>
                      <span className="result-main">{c.statement}</span>
                      <span className="result-sub">{c.status}</span>
                    </button>
                  ))}
                </div>
              )}
              {problems.length > 0 && (
                <div className="search-group">
                  <div className="group-label">Research Problems</div>
                  {problems.map((p) => (
                    <button
                      key={p.id}
                      className="result"
                      onClick={() => {
                        openMatrix(p.id)
                        setOpen(false)
                      }}
                    >
                      <span className="result-id">{p.id}</span>
                      <span className="result-main">{p.question}</span>
                      <span className="result-sub">Open matrix</span>
                    </button>
                  ))}
                </div>
              )}
              {query && !papers.length && !claims.length && !problems.length && (
                <div className="search-hint">No matches for “{q}”.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

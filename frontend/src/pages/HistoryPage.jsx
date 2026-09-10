import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Download, Trash2, Eye, CheckCircle,
  ChevronLeft, ChevronRight, X, AlertTriangle,
  FileDown, Shield, SlidersHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getModels, deleteModel } from '../utils/api'

const PER_PAGE = 12

function StatusBadge({ status }) {
  const m = {
    watermarked: ['badge-cyan',   'WATERMARKED'],
    verified:    ['badge-green',  'VERIFIED'],
    uploaded:    ['badge-purple', 'UPLOADED'],
    tampered:    ['badge-red',    'TAMPERED'],
  }
  const [cls, lbl] = m[status] || ['badge-purple', status?.toUpperCase() || 'UNKNOWN']
  return <span className={`badge ${cls}`}>{lbl}</span>
}

function IntBar({ v = 0 }) {
  const c = v >= 90 ? '#22c55e' : v >= 70 ? '#f59e0b' : '#f43f5e'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 56, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${v}%`, background: c, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#6b7a8d', minWidth: 36 }}>{v?.toFixed(1)}%</span>
    </div>
  )
}

function DeleteModal({ model, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(4,6,15,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 420,
          background: 'rgba(11,15,30,0.98)',
          border: '1px solid rgba(244,63,94,0.25)', borderRadius: 24,
          padding: '32px', boxShadow: '0 0 60px rgba(244,63,94,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} style={{ color: '#f43f5e' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: '#f0f4ff', marginBottom: 2 }}>Delete Model?</h3>
            <p style={{ color: '#4a5568', fontSize: '0.82rem' }}>This cannot be undone.</p>
          </div>
        </div>
        <p style={{ color: '#6b7a8d', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.6 }}>
          Delete <strong style={{ color: '#f0f4ff' }}>{model?.name}</strong>? All associated watermark records will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <NeonButton variant="ghost" onClick={onCancel}>Cancel</NeonButton>
          <NeonButton variant="danger" icon={Trash2} onClick={onConfirm}>Delete</NeonButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PaginationBtn({ children, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 32, height: 32, borderRadius: 9,
      background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
      color: active ? '#00e5ff' : disabled ? '#2d3748' : '#6b7a8d',
      fontSize: '0.8rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 8px',
    }}>
      {children}
    </button>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [models,  setModels]  = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('all')
  const [fmt,     setFmt]     = useState('all')
  const [page,    setPage]    = useState(1)
  const [delTarget, setDelTarget] = useState(null)

  const load = () => {
    getModels().then(m => { setModels(m || []); setLoading(false) })
  }

  useEffect(() => { document.title = 'Model History – CADShield' }, [])
  useEffect(() => {
    load()
    window.addEventListener('cadshield-projects-updated', load)
    return () => window.removeEventListener('cadshield-projects-updated', load)
  }, [])

  const filtered = useMemo(() => models.filter(m => {
    const q = search.toLowerCase()
    const s = !q || [m.name, m.project_name, m.owner_id, m.creator_user_id, m.model_id_str, m.project_id].filter(Boolean).some(v => v.toLowerCase().includes(q))
    const st = status === 'all' || (m.status && m.status.toLowerCase() === status.toLowerCase())
    const f  = fmt    === 'all' || (m.file_format && m.file_format.toLowerCase() === fmt.toLowerCase())
    return s && st && f
  }), [models, search, status, fmt])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const rows = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const handleDelete = async () => {
    try {
      await deleteModel(delTarget.id)
      setModels(p => p.filter(m => m.id !== delTarget.id))
      toast.success('Model deleted')
    } catch { toast.error('Failed to delete') }
    finally { setDelTarget(null) }
  }

  const exportCSV = () => {
    const hdr = 'Model ID,Name,Owner,Status,Integrity,Format,Created'
    const rows = filtered.map(m => [m.project_id||m.id, m.project_name||m.name, m.owner_id||m.creator_user_id||'', m.status, m.integrity_score, m.file_format, m.created_at].join(','))
    const blob = new Blob([[hdr,...rows].join('\n')],{type:'text/csv'})
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='cadshield_models.csv'; a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: '2rem', fontWeight: 800, color: '#f0f4ff',
                letterSpacing: '-0.02em', marginBottom: 6,
              }}>
                Model{' '}
                <span style={{ background:'linear-gradient(135deg,#00e5ff,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>History</span>
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                {filtered.length} model{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <NeonButton variant="ghost" icon={FileDown} onClick={exportCSV}>
                Export CSV
              </NeonButton>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search models, owners, IDs..."
                className="input-field"
                style={{ paddingLeft: 40 }}
              />
            </div>

            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="input-field"
              style={{ width: 'auto', minWidth: 140 }}
            >
              <option value="all">All Status</option>
              <option value="watermarked">Watermarked</option>
              <option value="verified">Verified</option>
              <option value="uploaded">Uploaded</option>
              <option value="tampered">Tampered</option>
            </select>

            <select
              value={fmt}
              onChange={e => { setFmt(e.target.value); setPage(1) }}
              className="input-field"
              style={{ width: 'auto', minWidth: 130 }}
            >
              <option value="all">All Formats</option>
              <option value="stl">STL</option>
              <option value="obj">OBJ</option>
              <option value="ply">PLY</option>
              <option value="off">OFF</option>
            </select>
          </div>

          {/* Table */}
          <GlassCard hover={false} padding="0" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Model</th><th>Owner</th><th>Status</th>
                    <th>Integrity</th><th>Format</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} style={{ display: 'inline-block' }}>
                        <Shield size={24} style={{ color: '#00e5ff' }} />
                      </motion.div>
                    </td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                      {search || status !== 'all' || fmt !== 'all'
                        ? 'No models match your filters.'
                        : 'No models yet. Protect your first model!'}
                    </td></tr>
                  ) : rows.map((m, i) => (
                    <motion.tr
                      key={m.id || i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{(page-1)*PER_PAGE+i+1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f0f4ff', fontSize: '0.88rem' }}>{m.project_name || m.name}</div>
                        {(m.project_id || m.model_id_str) && (
                          <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#00e5ff', marginTop: 2 }}>
                            {m.project_id || m.model_id_str}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{m.owner_id || m.creator_user_id || <span style={{ color: '#94a3b8' }}>—</span>}</div>
                        {(m.creator_name || m.designer_name) && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.creator_name || m.designer_name}</div>
                        )}
                      </td>
                      <td><StatusBadge status={m.status} /></td>
                      <td><IntBar v={m.integrity_score ?? 100} /></td>
                      <td><span className="badge badge-cyan">{(m.file_format||'STL').toUpperCase()}</span></td>
                      <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {m.created_at ? format(new Date(m.created_at),'MMM d, yyyy') : 'Recent'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[
                            {
                              icon: Eye,
                              title: '3D View',
                              color: '#00e5ff',
                              action: () => navigate(`/viewer?id=${encodeURIComponent(m.id || '')}&projectId=${encodeURIComponent(m.project_id || m.model_id_str || '')}`)
                            },
                            {
                              icon: CheckCircle,
                              title: 'Verify',
                              color: '#22c55e',
                              action: () => navigate(m.project_id ? `/verify-project?id=${encodeURIComponent(m.project_id)}` : '/verify')
                            },
                            {
                              icon: Trash2,
                              title: 'Delete',
                              color: '#f43f5e',
                              action: () => setDelTarget(m)
                            },
                          ].map(({ icon: Icon, title, color, action }) => (
                            <button
                              key={title} onClick={action} title={title}
                              style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: `${color}0a`, border: `1px solid ${color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: `${color}80`, transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.color = color }}
                              onMouseLeave={e => { e.currentTarget.style.background = `${color}0a`; e.currentTarget.style.color = `${color}80` }}
                            >
                              <Icon size={13} />
                            </button>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <p style={{ fontSize: '0.75rem', color: '#374151' }}>
                  {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <PaginationBtn disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft size={13} /></PaginationBtn>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = i + Math.max(1, page-2)
                    return pg <= totalPages
                      ? <PaginationBtn key={pg} active={page===pg} onClick={() => setPage(pg)}>{pg}</PaginationBtn>
                      : null
                  })}
                  <PaginationBtn disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight size={13} /></PaginationBtn>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {delTarget && <DeleteModal model={delTarget} onConfirm={handleDelete} onCancel={() => setDelTarget(null)} />}
      </AnimatePresence>
    </div>
  )
}

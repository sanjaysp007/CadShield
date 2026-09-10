import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderLock, Search, Plus, Download, Eye, CheckCircle,
  ExternalLink, Calendar, ShieldCheck, RefreshCw, Sparkles, Copy, Check
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getMyProjects, downloadWatermarkedModel } from '../utils/api'
import { getUser } from '../utils/auth'

export default function MyProjectsPage() {
  const navigate = useNavigate()
  const user = getUser() || {}
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMyProjects()
      setProjects(data || [])
    } catch (err) {
      toast.error('Failed to load your projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'My CAD Projects – CADShield'
    load()
    const reload = () => load()
    window.addEventListener('cadshield-projects-updated', reload)
    return () => window.removeEventListener('cadshield-projects-updated', reload)
  }, [])

  const copyProjectId = (pid) => {
    navigator.clipboard.writeText(pid)
    setCopiedId(pid)
    toast.success('Project ID copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleDownload = async (modelId, project) => {
    try {
      const filename = `cadshield_${project.project_id || 'protected'}_${project.original_filename || 'model.stl'}`
      await downloadWatermarkedModel(modelId, filename)
      toast.success('Download started!')
    } catch (err) {
      toast.error('Download failed: ' + (err.message || 'File not ready'))
    }
  }

  const filtered = projects.filter(p => {
    const term = query.toLowerCase()
    const matchesQuery = !query ||
      (p.project_name && p.project_name.toLowerCase().includes(term)) ||
      (p.project_id && p.project_id.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term))

    const matchesStatus = statusFilter === 'ALL' ||
      (p.status && p.status.toUpperCase() === statusFilter)

    return matchesQuery && matchesStatus
  })

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>

        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              My CAD <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Projects</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              All CAD models protected and authenticated under User ID: <strong style={{ color: '#00e5ff', fontFamily: 'monospace' }}>{user.user_id || user.owner_id}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={load}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1', fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'rotate-slow 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <Link to="/embed" style={{ textDecoration: 'none' }}>
              <NeonButton icon={Plus} size="md">
                Protect New CAD Model
              </NeonButton>
            </Link>
          </div>
        </div>

        {/* Filters & Search Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by Project Name or Project ID (e.g. PRJ-)..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 3 }}>
            {['ALL', 'WATERMARKED', 'VERIFIED', 'UPLOADED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '8px 14px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statusFilter === st ? 'rgba(0,229,255,0.12)' : 'transparent',
                  color: statusFilter === st ? '#00e5ff' : '#94a3b8',
                  boxShadow: statusFilter === st ? 'inset 0 0 0 1px rgba(0,229,255,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <FolderLock size={36} style={{ color: '#00e5ff' }} />
            </motion.div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading your CAD projects...</p>
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FolderLock size={28} style={{ color: '#00e5ff' }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>
              {query ? 'No matching projects found' : 'No CAD Projects Yet'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 24px' }}>
              {query ? `No project matches "${query}". Try searching with another term or reset the filter.` : 'You have not watermarked any CAD models under your account yet. Upload your first model to establish verifiable ownership.'}
            </p>
            <Link to="/embed" style={{ textDecoration: 'none' }}>
              <NeonButton icon={Plus} size="lg">
                Protect Your First Model
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filtered.map((proj, idx) => {
              const statusColors = {
                watermarked: { bg: 'rgba(0,229,255,0.08)', text: '#00e5ff', border: 'rgba(0,229,255,0.25)' },
                verified:    { bg: 'rgba(34,197,94,0.08)',  text: '#22c55e', border: 'rgba(34,197,94,0.25)' },
                uploaded:    { bg: 'rgba(139,92,246,0.08)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
              }[proj.status?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)' }

              const isWatermarked = proj.status?.toLowerCase() === 'watermarked'
              const isUploaded = !proj.status || proj.status?.toLowerCase() === 'uploaded'

              return (
                <motion.div
                  key={proj.id || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard style={{ padding: 24, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Top status bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          background: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}`
                        }}>
                          {proj.status || 'UPLOADED'}
                        </span>

                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {proj.created_at ? format(new Date(proj.created_at), 'MMM d, yyyy') : 'Recent'}
                        </span>
                      </div>

                      {/* Project Name */}
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6, lineHeight: 1.3 }}>
                        {proj.project_name || proj.name}
                      </h3>

                      {/* Project ID Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', borderRadius: 8,
                          background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
                          fontFamily: 'monospace', fontSize: '0.8rem', color: '#00e5ff',
                        }}>
                          <span>{proj.project_id || 'PRJ-PENDING'}</span>
                        </div>
                        {proj.project_id && (
                          <button
                            onClick={() => copyProjectId(proj.project_id)}
                            style={{ background: 'none', border: 'none', color: copiedId === proj.project_id ? '#22c55e' : '#94a3b8', cursor: 'pointer', padding: 3 }}
                            title="Copy Project ID"
                          >
                            {copiedId === proj.project_id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>

                      {/* Metrics strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 18 }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Format</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff', textTransform: 'uppercase' }}>{proj.file_format || 'STL'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Vertices</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff' }}>{proj.vertex_count?.toLocaleString() || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Integrity</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e' }}>{proj.integrity_score ? `${proj.integrity_score}%` : '100%'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                      {isWatermarked && (
                        <button
                          onClick={() => handleDownload(proj.id, proj)}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '9px 12px', borderRadius: 10,
                            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                            color: '#00e5ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          <Download size={14} /> Download
                        </button>
                      )}

                      {isUploaded && (
                        <Link to="/embed" style={{ textDecoration: 'none', flex: 1 }}>
                          <button
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '9px 12px', borderRadius: 10,
                              background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
                              border: '1px solid rgba(0,229,255,0.3)',
                              color: '#00e5ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <Sparkles size={14} /> Protect Model &rarr;
                          </button>
                        </Link>
                      )}

                      <Link to={`/viewer?id=${encodeURIComponent(proj.id || '')}&projectId=${encodeURIComponent(proj.project_id || '')}`} style={{ textDecoration: 'none' }}>
                        <button
                          style={{
                            padding: '9px 12px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                          }}
                        >
                          <Eye size={14} /> 3D View
                        </button>
                      </Link>

                      {proj.project_id && (
                        <Link to={`/verify-project?id=${proj.project_id}`} style={{ textDecoration: 'none' }}>
                          <button
                            style={{
                              padding: '9px 12px', borderRadius: 10,
                              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                              color: '#22c55e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            title="Verify Project Authenticity"
                          >
                            <ShieldCheck size={14} /> Verify
                          </button>
                        </Link>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Globe, Download, Eye, ShieldCheck, Box,
  RefreshCw, Copy, Check, ExternalLink, Calendar,
  User, Sparkles, Layers, CheckCircle2, Lock
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getGlobalProjects, downloadWatermarkedModel } from '../utils/api'
import { getUser } from '../utils/auth'

export default function GlobalSearchPage() {
  const currentUser = getUser() || {}
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [formatFilter, setFormatFilter] = useState('ALL')
  const [copiedId, setCopiedId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getGlobalProjects()
      setProjects(data || [])
    } catch (err) {
      toast.error('Failed to load global projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Global CAD Search – CADShield'
    load()

    const reload = () => load()
    window.addEventListener('cadshield-global-projects-updated', reload)
    window.addEventListener('cadshield-projects-updated', reload)
    window.addEventListener('storage', reload)

    return () => {
      window.removeEventListener('cadshield-global-projects-updated', reload)
      window.removeEventListener('cadshield-projects-updated', reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  const copyProjectId = (pid) => {
    navigator.clipboard.writeText(pid)
    setCopiedId(pid)
    toast.success('Project ID copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleDownload = async (modelId, project) => {
    try {
      const filename = `cadshield_${project.project_id || 'global'}_${project.original_filename || 'model.stl'}`
      await downloadWatermarkedModel(modelId, filename)
      toast.success('Downloading authentic CAD project!')
    } catch (err) {
      toast.error('Download failed: ' + (err.message || 'File not ready'))
    }
  }

  // Filter projects based on search query & format
  const filtered = projects.filter(p => {
    const term = query.toLowerCase()
    const matchesQuery = !query ||
      (p.project_name && p.project_name.toLowerCase().includes(term)) ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.project_id && p.project_id.toLowerCase().includes(term)) ||
      (p.creator_name && p.creator_name.toLowerCase().includes(term)) ||
      (p.designer_name && p.designer_name.toLowerCase().includes(term)) ||
      (p.creator_user_id && p.creator_user_id.toLowerCase().includes(term)) ||
      (p.owner_id && p.owner_id.toLowerCase().includes(term))

    const pFormat = (p.file_format || 'STL').toUpperCase()
    const matchesFormat = formatFilter === 'ALL' || pFormat === formatFilter

    return matchesQuery && matchesFormat
  })

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64, position: 'relative' }}>
      <div className="aurora" />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* Hero Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', color: '#00e5ff', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              <Globe size={13} /> Open CAD Ecosystem
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.1rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Global <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CAD Search</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 640 }}>
              Discover authentic, watermarked 3D CAD models approved and published by their original creators. Inspect in 3D and download CAD files ready for physical fabrication.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={load}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'rotate-slow 1s linear infinite' : 'none' }} />
              Refresh
            </button>

            <Link to="/my-projects" style={{ textDecoration: 'none' }}>
              <NeonButton icon={Layers} size="md">
                My Projects & Publishing
              </NeonButton>
            </Link>
          </div>
        </div>

        {/* Creator Privacy Notice Banner */}
        <div style={{
          marginBottom: 24, padding: '12px 18px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(0,229,255,0.06), rgba(139,92,246,0.04))',
          border: '1px solid rgba(0,229,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff', flexShrink: 0
            }}>
              <Lock size={15} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f4ff' }}>
                Creator-Controlled Privacy & Public Access
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                All uploaded CAD models remain strictly private to the creator by default. A model only appears on this Global Search tab after the creator explicitly enables &ldquo;Publish to Global Search&rdquo; from their My Projects page.
              </p>
            </div>
          </div>

          <Link to="/my-projects" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '0.74rem', color: '#00e5ff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              Manage My Models &rarr;
            </span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search global CAD models by name, creator, project ID (PRJ-)..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 3 }}>
            {['ALL', 'STL', 'OBJ', 'PLY', 'OFF'].map(fmt => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                style={{
                  padding: '8px 16px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: formatFilter === fmt ? 'rgba(0,229,255,0.14)' : 'transparent',
                  color: formatFilter === fmt ? '#00e5ff' : '#94a3b8',
                  boxShadow: formatFilter === fmt ? 'inset 0 0 0 1px rgba(0,229,255,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Global Models Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <Globe size={38} style={{ color: '#00e5ff' }} />
            </motion.div>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>Loading global CAD models...</p>
          </div>
        ) : filtered.length === 0 ? (
          <GlassCard style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <Globe size={30} style={{ color: '#00e5ff' }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>
              {query ? 'No matching global models found' : 'No Public CAD Models Shared Yet'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.5 }}>
              {query
                ? `No model matches "${query}". Try searching with another model name, format, or creator ID.`
                : 'Projects uploaded by creators remain private by default. When creators toggle "Publish to Global Search" in their My Projects page, the model becomes available here for the community to inspect in 3D and download.'}
            </p>
            <Link to="/my-projects" style={{ textDecoration: 'none' }}>
              <NeonButton icon={Layers} size="lg">
                Publish a Model from My Projects
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 22 }}>
            {filtered.map((proj, idx) => {
              const creatorId = proj.creator_user_id || proj.owner_id || 'OWN-UNKNOWN'
              const creatorName = proj.creator_name || proj.designer_name || 'CAD Creator'

              return (
                <motion.div
                  key={proj.id || proj.project_id || idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <GlassCard style={{ padding: 24, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                            background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <CheckCircle2 size={11} /> Approved by Creator
                          </span>

                          <span style={{
                            padding: '3px 7px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                            background: 'rgba(0,229,255,0.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.25)',
                          }}>
                            {proj.file_format || 'STL'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {proj.created_at ? format(new Date(proj.created_at), 'MMM d, yyyy') : 'Recent'}
                        </span>
                      </div>

                      {/* Project Name */}
                      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6, lineHeight: 1.3 }}>
                        {proj.project_name || proj.name}
                      </h3>

                      {/* Project ID Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '3px 9px', borderRadius: 8,
                          background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)',
                          fontFamily: 'monospace', fontSize: '0.78rem', color: '#00e5ff',
                        }}>
                          <span>{proj.project_id || proj.id || 'PRJ-PUBLIC'}</span>
                        </div>
                        {proj.project_id && (
                          <button
                            onClick={() => copyProjectId(proj.project_id)}
                            style={{ background: 'none', border: 'none', color: copiedId === proj.project_id ? '#22c55e' : '#94a3b8', cursor: 'pointer', padding: 2 }}
                            title="Copy Project ID"
                          >
                            {copiedId === proj.project_id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>

                      {/* Creator attribution line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Link to={`/creator/${encodeURIComponent(creatorId)}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e2e8f0', fontSize: '0.76rem', cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                          >
                            <User size={12} style={{ color: '#00e5ff' }} />
                            <span>Creator: <strong>{creatorName}</strong></span>
                            <span style={{ fontFamily: 'monospace', color: '#00e5ff', fontSize: '0.7rem' }}>({creatorId})</span>
                          </div>
                        </Link>
                      </div>

                      {/* Geometry Metrics strip */}
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

                    {/* Actions Footer: Everyone can 3D view and download approved projects */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <Link
                        to={`/viewer?id=${encodeURIComponent(proj.id || '')}&projectId=${encodeURIComponent(proj.project_id || '')}`}
                        style={{ textDecoration: 'none', flex: 1 }}
                      >
                        <button
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                            color: '#00e5ff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.1)'}
                        >
                          <Eye size={14} /> 3D View
                        </button>
                      </Link>

                      <button
                        onClick={() => handleDownload(proj.id || proj.project_id, proj)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '10px 14px', borderRadius: 10,
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(0,229,255,0.12))',
                          border: '1px solid rgba(139,92,246,0.3)',
                          color: '#c084fc', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.28)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(0,229,255,0.12))'}
                      >
                        <Download size={14} /> Download
                      </button>
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

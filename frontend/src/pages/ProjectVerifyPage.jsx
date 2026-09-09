import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, Search, CheckCircle2,
  Calendar, Building2, User, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { verifyProjectById } from '../utils/api'

export default function ProjectVerifyPage() {
  const [searchParams] = useSearchParams()
  const [projectIdInput, setProjectIdInput] = useState(searchParams.get('id') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)

  const doVerify = async (idToVerify) => {
    const id = (idToVerify || projectIdInput).trim().toUpperCase()
    if (!id) {
      toast.error('Please enter a Project ID to verify')
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const res = await verifyProjectById(id)
      setResult(res)
    } catch (err) {
      setResult({ is_verified: false, message: 'Project not found or invalid Project ID.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Project Verification – CADShield'
    const idFromParam = searchParams.get('id')
    if (idFromParam) {
      setProjectIdInput(idFromParam)
      doVerify(idFromParam)
    }
  }, [searchParams])

  const photoSrc = result?.profile_photo
    ? (result.profile_photo.startsWith('http') || result.profile_photo.startsWith('data:')
        ? result.profile_photo
        : `http://localhost:8000${result.profile_photo}`)
    : null

  const initials = (result?.creator_name || 'Creator')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64 }}>
      <div style={{ maxWidth: 840, margin: '0 auto', padding: '0 24px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600, marginBottom: 14,
          }}>
            <ShieldCheck size={14} /> Cryptographic Proof of Authorship
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 8 }}>
            CAD Project <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Verification</span>
          </h1>
          <p style={{ color: '#6b7a8d', fontSize: '0.9rem', maxWidth: 540, margin: '0 auto' }}>
            Verify the authenticity of any physical or digital 3D model using its unique Project ID.
          </p>
        </div>

        {/* Search Box Card */}
        <GlassCard glow="cyan" style={{ padding: 24, marginBottom: 32 }}>
          <form onSubmit={e => { e.preventDefault(); doVerify() }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
              <input
                type="text"
                value={projectIdInput}
                onChange={e => setProjectIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Project ID (e.g. PRJ-A8K2-9M4F)"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px 14px 46px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, color: '#f0f4ff',
                  fontSize: '0.95rem', fontFamily: 'monospace',
                  letterSpacing: '0.05em', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <NeonButton type="submit" size="lg" loading={loading} icon={ShieldCheck}>
              Verify Project
            </NeonButton>
          </form>
        </GlassCard>

        {/* Verification Result */}
        <AnimatePresence mode="wait">
          {searched && !loading && result && (
            <motion.div
              key={result.is_verified ? 'verified' : 'not-found'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {result.is_verified ? (
                /* VERIFIED PROJECT CARD */
                <GlassCard glow="green" style={{ padding: 32 }}>
                  {/* Status Banner */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24,
                    flexWrap: 'wrap', gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#22c55e', boxShadow: '0 0 20px rgba(34,197,94,0.2)'
                      }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>
                          Verified Project
                        </div>
                        <div style={{ color: '#6b7a8d', fontSize: '0.8rem' }}>
                          Watermark cryptographic record matches official creator identity
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 14px', borderRadius: 10,
                      background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
                      fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#00e5ff'
                    }}>
                      {result.project_id}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: '0.72rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Verified CAD Model
                    </div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>
                      {result.project_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#6b7a8d', fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} />
                        Created: {result.created_at ? new Date(result.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Verified Record'}
                      </span>
                      {result.integrity_score && (
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>
                          Integrity: {result.integrity_score}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator Card */}
                  <div style={{
                    padding: 20, borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        overflow: 'hidden', border: '2px solid rgba(0,229,255,0.3)',
                        background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(139,92,246,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {photoSrc ? (
                          <img src={photoSrc} alt={result.creator_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#00e5ff' }}>
                            {initials}
                          </span>
                        )}
                      </div>

                      {/* Creator Info */}
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                          Legitimate Creator
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff' }}>
                          {result.creator_name || 'Anonymous Creator'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#8892a4' }}>
                            {result.creator_user_id}
                          </span>
                          {result.creator_college && (
                            <span style={{ fontSize: '0.78rem', color: '#6b7a8d', display: 'flex', alignItems: 'center', gap: 4 }}>
                              · <Building2 size={12} /> {result.creator_college}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Creator Link */}
                    {result.creator_user_id && (
                      <Link to={`/creator/${encodeURIComponent(result.creator_user_id)}`} style={{ textDecoration: 'none' }}>
                        <NeonButton variant="secondary" size="sm" icon={ExternalLink}>
                          Creator Profile
                        </NeonButton>
                      </Link>
                    )}
                  </div>
                </GlassCard>
              ) : (
                /* NOT FOUND CARD */
                <GlassCard glow="red" style={{ padding: 36, textAlign: 'center' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#f43f5e', margin: '0 auto 16px',
                  }}>
                    <AlertTriangle size={26} />
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>
                    Project not found or invalid Project ID.
                  </h3>
                  <p style={{ color: '#6b7a8d', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 20px' }}>
                    No record found for ID <strong style={{ color: '#f43f5e', fontFamily: 'monospace' }}>{projectIdInput}</strong>. Ensure the Project ID was copied correctly or the model has been watermarked.
                  </p>
                  <button
                    onClick={() => setProjectIdInput('')}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#8892a4', padding: '8px 18px', borderRadius: 10, fontSize: '0.82rem', cursor: 'pointer',
                    }}
                  >
                    Clear Search
                  </button>
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Building2, Briefcase, MapPin, Calendar,
  ShieldCheck, FolderLock, ArrowLeft, ExternalLink, Sparkles
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getCreatorProfile, getAssetUrl } from '../utils/api'

export default function CreatorPage() {
  const { userId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = `Creator Profile – CADShield`
    setLoading(true)
    getCreatorProfile(userId)
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  const creator = data?.creator
  const projects = data?.projects || []

  const photoSrc = getAssetUrl(creator?.profile_photo)

  const initials = (creator?.full_name || 'CAD Creator')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64 }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

        {/* Back navigation */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/verify-project" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6b7a8d', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Project Verification
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '96px 0', color: '#6b7a8d' }}>
            Loading creator credentials...
          </div>
        ) : !creator ? (
          <GlassCard style={{ padding: 48, textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#f0f4ff', marginBottom: 8 }}>Creator Not Found</h2>
            <p style={{ color: '#6b7a8d', marginBottom: 20 }}>No creator profile matches ID "{userId}".</p>
            <Link to="/verify-project" style={{ textDecoration: 'none' }}>
              <NeonButton variant="secondary">Verify Another Project</NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div>
            {/* Creator Hero Card */}
            <GlassCard glow="cyan" style={{ padding: 36, marginBottom: 32 }}>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  overflow: 'hidden', border: '2px solid rgba(0,229,255,0.3)',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(139,92,246,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(0,229,255,0.2)', flexShrink: 0,
                }}>
                  {photoSrc ? (
                    <img src={photoSrc} alt={creator.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#00e5ff' }}>
                      {initials}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
                      {creator.full_name}
                    </h1>
                    <div style={{
                      padding: '3px 10px', borderRadius: 99,
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                      color: '#22c55e', fontSize: '0.72rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <ShieldCheck size={12} /> Verified CAD Creator
                    </div>
                  </div>

                  {/* Permanent User ID */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.2)', marginBottom: 14 }}>
                    <span style={{ fontSize: '0.68rem', color: '#6b7a8d', textTransform: 'uppercase' }}>Permanent User ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#00e5ff' }}>{creator.user_id}</span>
                  </div>

                  {/* Institution / Role / Location */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: '#8892a4', fontSize: '0.85rem', marginBottom: 16 }}>
                    {creator.college_company && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={14} style={{ color: '#00e5ff' }} /> {creator.college_company}
                      </span>
                    )}
                    {creator.department && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={14} style={{ color: '#a78bfa' }} /> {creator.department}
                      </span>
                    )}
                    {creator.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} style={{ color: '#f59e0b' }} /> {creator.location}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      "{creator.bio}"
                    </p>
                  )}
                </div>

              </div>
            </GlassCard>

            {/* Verified Projects Showcase */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#f0f4ff' }}>
                  Authenticated CAD Models ({projects.length})
                </h2>
                <span style={{ color: '#4a5568', fontSize: '0.8rem' }}>
                  Digital watermarks cryptographically bound to this creator
                </span>
              </div>

              {projects.length === 0 ? (
                <GlassCard style={{ padding: 32, textAlign: 'center', color: '#6b7a8d' }}>
                  No publicly listed projects yet under this User ID.
                </GlassCard>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {projects.map((p, idx) => (
                    <GlassCard key={p.project_id || idx} style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#00e5ff', fontWeight: 700 }}>
                          {p.project_id}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                          {p.integrity_score}% Integrity
                        </span>
                      </div>
                      <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 12 }}>
                        {p.project_name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.72rem', color: '#4a5568' }}>
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Active'}
                        </span>
                        <Link to={`/verify-project?id=${p.project_id}`} style={{ textDecoration: 'none' }}>
                          <span style={{ fontSize: '0.78rem', color: '#00e5ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Verify <ExternalLink size={12} />
                          </span>
                        </Link>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

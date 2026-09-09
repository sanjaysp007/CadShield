import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Upload,
  User, Fingerprint, Clock, Activity, Search, AlertOctagon,
  Zap, RotateCcw, Lock, Eye, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import ModelUploader from '../components/ModelUploader'
import SecurityScore from '../components/SecurityScore'
import { verifyModel } from '../utils/api'
import { format } from 'date-fns'

/* ── Mini components ────────────────────────────────── */
function CheckRow({ ok, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 12,
      background: ok ? 'rgba(34,197,94,0.05)' : 'rgba(244,63,94,0.05)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)'}`,
    }}>
      {ok
        ? <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
        : <XCircle    size={16} style={{ color: '#f43f5e', flexShrink: 0 }} />
      }
      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: ok ? '#22c55e' : '#f43f5e' }}>{label}</span>
    </div>
  )
}

function MetaRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: '0.72rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: '#8892a4', fontFamily: mono ? 'monospace' : 'inherit', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{value ?? '—'}</span>
    </div>
  )
}

function TamperMode({ icon: Icon, label, desc, color, onClick, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, borderColor: `${color}50` }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 14, textAlign: 'left',
        background: `${color}07`, border: `1px solid ${color}20`,
        cursor: loading ? 'not-allowed' : 'pointer',
        width: '100%', transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `${color}15`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f4ff', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: '0.73rem', color: '#4a5568' }}>{desc}</div>
      </div>
    </motion.button>
  )
}

export default function VerifyPage() {
  const navigate = useNavigate()
  const [file,       setFile]       = useState(null)
  const [modelId,    setModelId]    = useState('')
  const [showId,     setShowId]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [tamperRes,  setTamperRes]  = useState(null)
  const [tamperLoad, setTamperLoad] = useState(false)

  useEffect(() => { document.title = 'Verify Model – CADShield' }, [])

  const handleVerify = async () => {
    if (!file) return toast.error('Please upload a 3D model first')
    setLoading(true)
    try {
      const r = await verifyModel(file, modelId || null)
      setResult(r)
      if (r.is_authenticated) toast.success('✓ Model authenticated!')
      else if (r.is_tampered)  toast.error('⚠ Tampering detected!')
      else                     toast('Unknown origin', { icon: '🔍' })
    } catch (e) { toast.error(e?.response?.data?.detail || 'Verification failed') }
    finally { setLoading(false) }
  }

  const runTamper = async (mode) => {
    setTamperLoad(true)
    try {
      await new Promise(r => setTimeout(r, 2200))
      const drop = mode === 'watermark' ? 28 + Math.random() * 12 : 12 + Math.random() * 16
      const r = {
        original_integrity: result?.integrity_score || 99.8,
        current_integrity:  Math.max(25, (result?.integrity_score || 99.8) - drop),
        drop: drop.toFixed(1), mode,
      }
      setTamperRes(r)
      toast.error(`Tampering simulated — integrity ↓${r.drop}%`)
    } finally { setTamperLoad(false) }
  }

  const score  = tamperRes ? tamperRes.current_integrity : result?.integrity_score
  const isAuth = result?.is_authenticated && !tamperRes
  const isTamp = result?.is_tampered || !!tamperRes

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: '2rem', fontWeight: 800, color: '#f0f4ff',
              letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Verify{' '}
              <span style={{ background: 'linear-gradient(135deg,#00e5ff,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Authenticity
              </span>
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>Upload a watermarked model to extract and verify ownership.</p>
          </motion.div>

          {/* Upload card */}
          <GlassCard hover={false} padding="28px" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Upload size={14} style={{ color: '#00e5ff' }} />
              </div>
              <span style={{ fontWeight: 700, color: '#f0f4ff' }}>Upload Model for Verification</span>
            </div>
            <ModelUploader onFileAccepted={setFile} loading={loading} />
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setShowId(v=>!v)} style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.78rem', cursor: 'pointer' }}>
                {showId ? '▾' : '▸'} I know the Model ID (optional)
              </button>
              <AnimatePresence>
                {showId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <input className="input-field" style={{ marginTop: 10 }} placeholder="Paste model DB ID for direct lookup…" value={modelId} onChange={e => setModelId(e.target.value)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <NeonButton onClick={handleVerify} loading={loading} icon={Search} size="lg">Verify Model</NeonButton>
            </div>
          </GlassCard>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Status hero */}
                <div style={{
                  padding: '28px', borderRadius: 20,
                  background: isAuth
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(0,229,255,0.04))'
                    : 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(245,158,11,0.04))',
                  border: `1px solid ${isAuth ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
                    <div>
                      <h2 style={{
                        fontFamily: "'Space Grotesk',sans-serif",
                        fontSize: '1.5rem', fontWeight: 800, marginBottom: 16,
                        color: isAuth ? '#22c55e' : '#f43f5e',
                        filter: `drop-shadow(0 0 8px ${isAuth ? 'rgba(34,197,94,0.5)' : 'rgba(244,63,94,0.5)'})`,
                      }}>
                        {isAuth ? '✓ Model Authenticated' : '⚠ Authentication Failed'}
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <CheckRow ok={result.is_authenticated} label={result.is_authenticated ? 'Watermark Detected & Valid' : 'Watermark Not Found or Invalid'} />
                        <CheckRow ok={!result.is_tampered}     label={!result.is_tampered ? 'Model Integrity Intact' : 'Tampering Detected'} />
                        <CheckRow ok={result.hmac_valid !== false} label={result.hmac_valid !== false ? 'HMAC Signature Valid' : 'HMAC Signature Invalid'} />
                      </div>
                    </div>
                    <SecurityScore score={score || 0} size={180} label={isTamp ? 'TAMPERED' : isAuth ? 'VERIFIED' : 'UNKNOWN'} />
                  </div>
                </div>

                {/* Ownership + metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <GlassCard hover={false} padding="22px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <User size={14} style={{ color: '#00e5ff' }} />
                      <span style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem' }}>Ownership Details</span>
                    </div>
                    <MetaRow label="Owner ID"    value={result.owner_id} />
                    <MetaRow label="Designer"    value={result.designer_name} />
                    <MetaRow label="Model ID"    value={result.model_id} mono />
                    <MetaRow label="Copyright"   value={result.copyright_info} />
                    <MetaRow label="Watermark ID" value={result.watermark_id} mono />
                  </GlassCard>
                  <GlassCard hover={false} padding="22px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <Activity size={14} style={{ color: '#8b5cf6' }} />
                      <span style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem' }}>Verification Metrics</span>
                    </div>
                    <MetaRow label="Integrity"       value={`${result.integrity_score?.toFixed(2)}%`} />
                    <MetaRow label="Tampering %"     value={`${result.tampering_percentage?.toFixed(2)}%`} />
                    <MetaRow label="Confidence"      value={`${result.confidence_score?.toFixed(2)}%`} />
                    <MetaRow label="Vertex Changes"  value={result.vertex_changes?.toLocaleString()} />
                    <MetaRow label="Face Changes"    value={result.face_changes?.toLocaleString()} />
                    <MetaRow label="Verified At"     value={format(new Date(), 'MMM d, yyyy HH:mm')} />
                  </GlassCard>
                </div>

                {/* Tamper Simulator */}
                <GlassCard hover={false} padding="24px" style={{ border: '1px solid rgba(244,63,94,0.12)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontWeight: 700, color: '#f0f4ff' }}>Tamper Simulation</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', marginLeft: 4 }}>⚠ DEMO TOOL</span>
                  </div>
                  <p style={{ color: '#374151', fontSize: '0.8rem', marginBottom: 16 }}>Simulate various modification types to observe watermark resilience.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: Zap,          label: 'Vertex Noise',       desc: 'Random vertex perturbations',     color: '#f59e0b', mode: 'vertex'    },
                      { icon: Eye,          label: 'Geometry Scale',     desc: 'Scale a mesh region',             color: '#f59e0b', mode: 'geometry'  },
                      { icon: AlertOctagon, label: 'Watermark Attack',   desc: 'Target watermarked vertices',     color: '#f43f5e', mode: 'watermark' },
                      { icon: Lock,         label: 'Partial Corruption', desc: 'Replace a mesh slab with noise', color: '#f43f5e', mode: 'partial'   },
                    ].map(m => (
                      <TamperMode key={m.mode} {...m} loading={tamperLoad} onClick={() => runTamper(m.mode)} />
                    ))}
                  </div>
                  <AnimatePresence>
                    {tamperRes && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        style={{ marginTop: 16, padding: '16px', borderRadius: 14, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)' }}
                      >
                        <p style={{ color: '#f43f5e', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertOctagon size={14} /> Tampering Detected
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, textAlign: 'center' }}>
                          {[
                            ['Before', `${tamperRes.original_integrity?.toFixed(1)}%`, '#22c55e'],
                            ['After',  `${tamperRes.current_integrity?.toFixed(1)}%`,  '#f43f5e'],
                            ['Drop',   `-${tamperRes.drop}%`,                          '#f59e0b'],
                          ].map(([l,v,c]) => (
                            <div key={l}>
                              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 800, color: c, filter:`drop-shadow(0 0 6px ${c}80)` }}>{v}</div>
                              <div style={{ fontSize: '0.7rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>

                {/* Actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <NeonButton variant="secondary" icon={RotateCcw} onClick={() => { setResult(null); setFile(null); setTamperRes(null) }}>Verify Another</NeonButton>
                  <NeonButton variant="ghost"     onClick={() => navigate('/analytics')}>View Analytics</NeonButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

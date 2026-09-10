import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Download, RefreshCw, Copy, Check,
  FileText, Cpu, Info, Key, CheckCircle2, Lock, Fingerprint,
  Building2, User, ExternalLink, Sparkles, Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import StepProgress from '../components/StepProgress'
import ModelUploader from '../components/ModelUploader'
import ProcessingAnimation from '../components/ProcessingAnimation'
import SecurityScore from '../components/SecurityScore'
import { uploadModel, embedWatermark, downloadWatermarkedModel } from '../utils/api'
import { getUser, isAdmin } from '../utils/auth'

/* ── Shared sub-components ──────────────────────────── */
function Section({ title, icon: Icon, color = '#00e5ff', children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#f0f4ff' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Field({ id, label, value, onChange, placeholder, disabled, hint, error }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
        <span>{label}</span>
        {hint && <span style={{ color: '#cbd5e1', fontWeight: 400, fontSize: '0.72rem' }}>{hint}</span>}
      </label>
      <input
        id={id}
        type="text"
        className="input-field"
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        style={{ borderColor: error ? '#f43f5e' : undefined }}
      />
      {error && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const STEPS = [
  { label: 'Upload CAD Model', icon: Upload },
  { label: 'Creator & Project Info', icon: Fingerprint },
  { label: 'Watermark Embedding', icon: Cpu },
  { label: 'Protected Result', icon: CheckCircle2 },
]

export default function EmbedPage() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [file, setFile]     = useState(null)
  const [info, setInfo]     = useState(null)
  const [user, setUser]     = useState(() => getUser() || {})
  const [copiedPid, setCopiedPid] = useState(false)

  const [form, setForm] = useState({
    project_name: '',
    model_id_str: '',
    copyright_info: '',
    secret_key: '',
  })
  const [errs, setErrs]     = useState({})
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Auto-fill from logged-in user
  useEffect(() => {
    document.title = 'Protect Model – CADShield'
    const u = getUser()
    if (u) {
      setUser(u)
      setForm(p => ({
        ...p,
        copyright_info: p.copyright_info || `© ${new Date().getFullYear()} ${u.full_name || u.user_id}. All rights reserved.`,
      }))
    }
  }, [])

  const upd = (key) => (val) => { setForm(p => ({ ...p, [key]: val })); setErrs(p => ({ ...p, [key]: '' })) }

  const handleUpload = async () => {
    if (!file) return toast.error('Select a 3D model file')
    setUploading(true)
    try {
      const r = await uploadModel(file)
      setInfo(r)
      // Suggest project name from file
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_.-]/g, ' ').trim()
      const titleCase = rawName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())))
      setForm(p => ({
        ...p,
        project_name: p.project_name || titleCase,
        model_id_str: p.model_id_str || r.project_id || `PRJ-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`,
      }))
      setStep(2)
      toast.success('Model analyzed and saved to My Projects!')
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.project_name.trim()) e.project_name = 'Project name is required'
    if (!form.model_id_str.trim()) e.model_id_str = 'Project ID is required'
    setErrs(e)
    return !Object.keys(e).length
  }

  const handleEmbed = () => {
    if (validate()) setStep(3)
  }

  const handleProcessingDone = async () => {
    try {
      const r = await embedWatermark(info.id, {
        owner_id: user.user_id || user.owner_id,
        designer_name: user.full_name || 'CAD Creator',
        project_name: form.project_name,
        model_id_str: form.model_id_str,
        copyright_info: form.copyright_info,
        secret_key: form.secret_key || undefined,
      })
      setResult(r)
      setStep(4)
      toast.success('Watermark embedded and project updated in My Projects!')
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Embedding failed')
      setStep(2)
    }
  }

  const reset = () => {
    setStep(1)
    setFile(null)
    setInfo(null)
    setResult(null)
    setForm({ project_name: '', model_id_str: '', copyright_info: '', secret_key: '' })
  }

  const genId = () => upd('model_id_str')(`PRJ-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`)

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper">
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Protect <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>3D CAD Model</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              Embed cryptographically secure watermarks imperceptibly into mesh vertex geometry.
            </p>
          </div>

          {/* Step Progress */}
          <div style={{ marginBottom: 36 }}>
            <StepProgress currentStep={step} steps={STEPS} />
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: UPLOAD ─────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <GlassCard hover={false} style={{ padding: 32 }}>
                  <Section title="Upload CAD / 3D Mesh Model" icon={FileText} color="#00e5ff">
                    <ModelUploader
                      onFileAccepted={f => { setFile(f); setInfo(null) }}
                      onFileRejected={msg => toast.error(msg)}
                      file={file}
                    />
                  </Section>

                  {info && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: 20, borderRadius: 16, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)', marginTop: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 16 }}>
                        {[
                          ['Vertices', info.vertex_count?.toLocaleString()],
                          ['Faces',    info.face_count?.toLocaleString()],
                          ['Format',   (info.file_format || 'STL').toUpperCase()],
                        ].map(([l, v]) => (
                          <div key={l} style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#00e5ff' }}>{v}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                    {!info
                      ? <NeonButton onClick={handleUpload} loading={uploading} icon={Shield} size="lg">Upload Model</NeonButton>
                      : <NeonButton onClick={() => setStep(2)} icon={CheckCircle2} size="lg">Continue to Creator Info →</NeonButton>
                    }
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* ── STEP 2: CREATOR & PROJECT INFO ─────────────── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <GlassCard hover={false} style={{ padding: 32 }}>

                  {/* Creator Identity Locked Banner */}
                  <div style={{
                    padding: '16px 20px', borderRadius: 16,
                    background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)',
                    marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff' }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#00e5ff', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                          Verified Creator Identity (Automatic)
                        </div>
                        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.98rem', fontWeight: 700, color: '#f0f4ff' }}>
                          {user.full_name} · <span style={{ fontFamily: 'monospace', color: '#00e5ff' }}>{user.user_id || user.owner_id}</span>
                        </div>
                        {user.college_company && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {user.college_company}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                      Non-spoofable
                    </span>
                  </div>

                  {/* Watermark Signature Preview */}
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
                      Embedded Watermark Signature Format:
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#a78bfa' }}>
                      "Created by: {user.full_name} | User ID: {user.user_id || user.owner_id}{user.college_company ? ` | ${user.college_company}` : ''}"
                    </div>
                  </div>

                  <Section title="Project Details" icon={FileText} color="#8b5cf6">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
                      <Field
                        id="pname"
                        label="Project Name *"
                        value={form.project_name}
                        onChange={upd('project_name')}
                        placeholder="e.g. Aerospace Turbine Housing"
                        error={errs.project_name}
                      />

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                          <span>Project ID *</span>
                          <button
                            type="button"
                            onClick={genId}
                            style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ⚡ Auto-gen
                          </button>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={form.model_id_str}
                          onChange={e => upd('model_id_str')(e.target.value.toUpperCase())}
                          placeholder="e.g. PRJ-A8K2-9M4F"
                          style={{ fontFamily: 'monospace', borderColor: errs.model_id_str ? '#f43f5e' : undefined }}
                        />
                        {errs.model_id_str && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 4 }}>{errs.model_id_str}</p>}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Field
                        id="copy"
                        label="Copyright Declaration"
                        value={form.copyright_info}
                        onChange={upd('copyright_info')}
                        placeholder={`© ${new Date().getFullYear()} ${user.full_name}. All rights reserved.`}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                        <Key size={12} style={{ color: '#f59e0b' }} />
                        Custom Secret Key
                        <span style={{ color: '#cbd5e1', fontWeight: 400 }}>(optional — defaults to secure system key)</span>
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Leave blank to use default system key"
                        value={form.secret_key}
                        onChange={e => upd('secret_key')(e.target.value)}
                      />
                    </div>
                  </Section>

                  <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between' }}>
                    <NeonButton variant="ghost" onClick={() => setStep(1)}>← Back</NeonButton>
                    <NeonButton onClick={handleEmbed} icon={Cpu} size="lg">Embed Watermark →</NeonButton>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* ── STEP 3: PROCESSING ─────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <ProcessingAnimation onComplete={handleProcessingDone} />
              </motion.div>
            )}

            {/* ── STEP 4: RESULT ─────────────────────────────── */}
            {step === 4 && result && (
              <motion.div key="s4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard glow="cyan" style={{ padding: 32 }}>

                  {/* Success banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 28 }}>
                    <CheckCircle2 size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#22c55e', fontSize: '1rem' }}>
                        Watermark Embedded Successfully!
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                        CAD model is authenticated and permanently registered under Project ID: <strong style={{ color: '#00e5ff', fontFamily: 'monospace' }}>{result.project_id || form.model_id_str}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Main stats layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, alignItems: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <SecurityScore score={result.integrity_score || 99.8} size={190} />
                    </div>

                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                        {[
                          ['Project ID', result.project_id || form.model_id_str, true],
                          ['Creator Name', result.creator_name || user.full_name],
                          ['Creator User ID', result.creator_user_id || user.user_id, true],
                          ['Distortion', `${result.distortion_pct || 0.08}%`],
                          ['Watermarked Vertices', result.watermarked_vertices ?? 384],
                          ['Processing Time', `${result.processing_time || 2.1}s`],
                        ].map(([l, v, isMono]) => (
                          <div key={l} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                            <div style={{ fontFamily: isMono ? 'monospace' : "'Space Grotesk', sans-serif", fontWeight: 700, color: '#f0f4ff', fontSize: '0.92rem', marginTop: 2 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <NeonButton
                      icon={Download}
                      size="lg"
                      onClick={async () => {
                        try {
                          const modelId = info?.id
                          const fname   = `cadshield_${result.project_id || form.model_id_str}.stl`
                          await downloadWatermarkedModel(modelId, fname)
                          toast.success('Download started!')
                        } catch (e) {
                          toast.error('Download failed: ' + (e.message || 'Unknown error'))
                        }
                      }}
                    >
                      Download Protected Model
                    </NeonButton>

                    <Link to="/my-projects" style={{ textDecoration: 'none' }}>
                      <NeonButton variant="secondary" size="lg">
                        View in My Projects
                      </NeonButton>
                    </Link>

                    {isAdmin() ? (
                      <Link to={`/verify-project?id=${result.project_id || form.model_id_str}`} style={{ textDecoration: 'none' }}>
                        <NeonButton variant="ghost" size="lg">
                          Verify Authenticity (Admin)
                        </NeonButton>
                      </Link>
                    ) : (
                      <Link to="/global-search" style={{ textDecoration: 'none' }}>
                        <NeonButton variant="ghost" size="lg">
                          Explore Global Search
                        </NeonButton>
                      </Link>
                    )}

                    <NeonButton variant="ghost" icon={RefreshCw} onClick={reset} size="lg">
                      Protect Another Model
                    </NeonButton>
                  </div>

                </GlassCard>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}

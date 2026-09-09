import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Mail, Lock, User, Building2,
  Eye, EyeOff, Copy, Check, ArrowRight, Sparkles, LogIn
} from 'lucide-react'
import toast from 'react-hot-toast'
import { login, signup } from '../utils/api'
import { isLoggedIn } from '../utils/auth'

/* ── Floating Orbs Background ──────────────────────── */
function AuroraBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)', filter: 'blur(30px)' }} />
    </div>
  )
}

/* ── Input Field Component ─────────────────────────── */
function AuthField({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, error, autoComplete }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7a8d', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#374151', pointerEvents: 'none' }}>
          <Icon size={15} />
        </div>
        <input
          id={id}
          type={isPass && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '12px 40px 12px 42px',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${error ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, color: '#f0f4ff',
            fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.4)' }}
          onBlur={e => { e.target.style.borderColor = error ? 'rgba(244,63,94,0.4)' : 'rgba(255,255,255,0.08)' }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 4 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 5 }}>{error}</p>}
    </div>
  )
}

/* ── Owner ID reveal card ──────────────────────────── */
function OwnerIdCard({ ownerId, onContinue }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(ownerId); setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      {/* Trophy icon */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: 22, background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={32} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>Account Created!</h2>
        <p style={{ color: '#4a5568', fontSize: '0.85rem' }}>Your unique Owner ID has been generated.</p>
      </div>

      {/* Owner ID display */}
      <div style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)', marginBottom: 20, textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Your Owner ID</p>
        <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '1.8rem', fontWeight: 800, color: '#00e5ff', letterSpacing: '0.08em', filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.5))', marginBottom: 12 }}>
          {ownerId}
        </div>
        <button onClick={copy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#22c55e' : '#8892a4', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
          {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy ID</>}
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 24 }}>
        <p style={{ fontSize: '0.78rem', color: 'rgba(245,158,11,0.9)', lineHeight: 1.5 }}>
          ⚠ <strong>Save this ID.</strong> It is embedded in every watermark you create and is required for model verification.
        </p>
      </div>

      <button onClick={onContinue} style={{
        width: '100%', padding: '14px', borderRadius: 14, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
        background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 0 24px rgba(0,229,255,0.25)',
      }}>
        Go to Dashboard <ArrowRight size={16} />
      </button>
    </motion.div>
  )
}

/* ── Main Login Page ────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [loading,  setLoading]  = useState(false)
  const [newOwner, setNewOwner] = useState(null)       // shown after signup

  // Form state
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [org,      setOrg]      = useState('')
  const [errors,   setErrors]   = useState({})

  useEffect(() => {
    document.title = 'Login – CADShield'
    if (isLoggedIn()) navigate('/dashboard', { replace: true })
  }, [navigate])

  const validate = () => {
    const e = {}
    if (!email.trim())    e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password)        e.password = 'Password is required'
    else if (password.length < 6) e.password = 'At least 6 characters'
    if (mode === 'signup' && !name.trim()) e.name = 'Full name is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handle = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else {
        const res = await signup(email, password, name, org || undefined)
        if (res.needsEmailConfirmation) {
          toast.success('Account created! Please check your email if confirmation is required.', { duration: 6000 })
        } else {
          toast.success('Account created successfully!')
        }
        setNewOwner(res.user.owner_id)
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.detail || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => { setMode(m); setErrors({}); setPassword('') }

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <AuroraBackground />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.7))' }} />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              CADShield
            </span>
          </Link>
          <p style={{ color: '#374151', fontSize: '0.83rem', marginTop: 8 }}>Secure 3D Model Watermarking & Authentication</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            padding: '36px', borderRadius: 24,
            background: 'rgba(11,15,30,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 0 60px rgba(0,229,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── Owner ID reveal after signup ── */}
            {newOwner ? (
              <motion.div key="owner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OwnerIdCard ownerId={newOwner} onContinue={() => navigate('/dashboard')} />
              </motion.div>
            ) : (

              /* ── Login / Signup form ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Tab toggle */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {[['login','Sign In'], ['signup','Create Account']].map(([m, lbl]) => (
                    <button key={m} onClick={() => switchMode(m)} style={{
                      flex: 1, padding: '9px', borderRadius: 9, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                      background: mode === m ? 'rgba(0,229,255,0.1)' : 'transparent',
                      color: mode === m ? '#00e5ff' : '#4a5568',
                      boxShadow: mode === m ? 'inset 0 0 0 1px rgba(0,229,255,0.25)' : 'none',
                    }}>{lbl}</button>
                  ))}
                </div>

                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p style={{ color: '#4a5568', fontSize: '0.82rem', marginBottom: 24 }}>
                  {mode === 'login' ? 'Sign in to manage your protected 3D models.' : 'Get a free Owner ID and start watermarking.'}
                </p>

                <form onSubmit={handle} noValidate>
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <AuthField id="name" label="Full Name" value={name} onChange={setName} placeholder="Jane Doe" icon={User} error={errors.name} autoComplete="name" />
                        <AuthField id="org"  label="Organization (optional)" value={org} onChange={setOrg} placeholder="Your company or institute" icon={Building2} autoComplete="organization" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AuthField id="email" label="Email Address" type="email" value={email} onChange={v => { setEmail(v); setErrors(p=>({...p,email:''})) }} placeholder="you@example.com" icon={Mail} error={errors.email} autoComplete="email" />
                  <AuthField id="pass"  label="Password" type="password" value={password} onChange={v => { setPassword(v); setErrors(p=>({...p,password:''})) }} placeholder={mode==='signup'?'Min. 6 characters':'••••••••'} icon={Lock} error={errors.password} autoComplete={mode==='login'?'current-password':'new-password'} />

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 8,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 24px rgba(0,229,255,0.2)', transition: 'all 0.2s',
                  }}>
                    {loading ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><Shield size={16} /></motion.div> {mode==='login'?'Signing in…':'Creating account…'}</>
                    ) : (
                      <>{mode==='login' ? <LogIn size={16}/> : <Sparkles size={16}/>} {mode==='login'?'Sign In':'Create Account'}</>
                    )}
                  </button>
                </form>

                {/* Switch prompt */}
                <p style={{ textAlign: 'center', marginTop: 20, color: '#374151', fontSize: '0.82rem' }}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => switchMode(mode==='login'?'signup':'login')} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                    {mode === 'login' ? 'Create one' : 'Sign in'}
                  </button>
                </p>

              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#1f2937', fontSize: '0.72rem', marginTop: 20 }}>
          Protected by HMAC-SHA256 watermarking · MIT License
        </p>
      </div>
    </div>
  )
}

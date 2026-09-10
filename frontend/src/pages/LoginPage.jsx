import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Mail, Lock, User, Building2,
  Eye, EyeOff, Copy, Check, ArrowRight, Sparkles, LogIn,
  KeyRound, RefreshCw, ArrowLeft, ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { login, signup } from '../utils/api'
import { isLoggedIn } from '../utils/auth'
import { supabase } from '../utils/supabase'

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

/* ── 6-Digit OTP Input Component ───────────────────── */
function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([])
  const digits = (value || '').padEnd(6, '').split('').slice(0, 6)

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits]
      if (next[i]) { next[i] = ''; onChange(next.join('').trimEnd()) }
      else if (i > 0) { refs.current[i - 1]?.focus(); next[i - 1] = ''; onChange(next.join('').trimEnd()) }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus()
  }

  const handleChange = (i, char) => {
    const cleaned = char.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = cleaned
    const newVal = next.join('')
    onChange(newVal)
    if (cleaned && i < 5) refs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      const targetIdx = Math.min(pasted.length, 5)
      refs.current[targetIdx]?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44, height: 50, textAlign: 'center',
            fontFamily: "'Space Grotesk', monospace", fontSize: '1.3rem', fontWeight: 700,
            color: '#00e5ff',
            background: 'rgba(255,255,255,0.03)',
            border: digits[i] ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, outline: 'none', transition: 'border-color 0.2s',
            boxShadow: digits[i] ? '0 0 10px rgba(0,229,255,0.15)' : 'none',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,229,255,0.6)' }}
          onBlur={e => { e.target.style.borderColor = digits[i] ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.1)' }}
        />
      ))}
    </div>
  )
}

/* ── Owner ID reveal card ──────────────────────────── */
function OwnerIdCard({ ownerId, onContinue }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(ownerId); setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: 22, background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(139,92,246,0.12))', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={32} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>Account Verified!</h2>
        <p style={{ color: '#4a5568', fontSize: '0.85rem' }}>Your unique Owner ID has been generated.</p>
      </div>

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
  // Modes: 'login' | 'signup' | 'otp' | 'forgot' | 'forgot-otp' | 'reset-password'
  const [mode,     setMode]     = useState('login')
  const [loading,  setLoading]  = useState(false)
  const [newOwner, setNewOwner] = useState(null)

  // Form state
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [name,        setName]        = useState('')
  const [org,         setOrg]         = useState('')
  const [otp,         setOtp]         = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors,      setErrors]      = useState({})

  // OTP resend countdown
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    document.title = 'Login – CADShield'
    if (isLoggedIn()) navigate('/dashboard', { replace: true })
  }, [navigate])

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'

    if (mode === 'login' || mode === 'signup') {
      if (!password) e.password = 'Password is required'
      else if (password.length < 6) e.password = 'At least 6 characters'
    }

    if (mode === 'signup' && !name.trim()) e.name = 'Full name is required'

    if (mode === 'reset-password') {
      if (!newPassword) e.newPassword = 'New password is required'
      else if (newPassword.length < 6) e.newPassword = 'At least 6 characters'
    }

    setErrors(e)
    return !Object.keys(e).length
  }

  // Handle Login & Signup initial submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('Welcome back!')
        navigate('/dashboard')
      } else if (mode === 'signup') {
        const res = await signup(email, password, name, org || undefined)
        // If email confirmation / OTP is required by Supabase
        if (res.needsEmailConfirmation) {
          toast.success('Verification code sent to your email!')
          setMode('otp')
          setResendCooldown(60)
        } else {
          // Direct login or auto-confirmed
          toast.success('Account created successfully!')
          setNewOwner(res.user.owner_id)
        }
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.detail || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Verification for Registration
  const handleOtpVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      setErrors({ otp: 'Please enter a 6-digit code' })
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'signup',
      })
      if (error) {
        // Also try 'email' type if 'signup' fails
        const { data: emailData, error: emailErr } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp.trim(),
          type: 'email',
        })
        if (emailErr) throw emailErr
      }

      toast.success('Email verified successfully!')
      // Refresh session
      const { data: { session } } = await supabase.auth.getSession()
      const ownerId = session?.user?.user_metadata?.owner_id || session?.user?.user_metadata?.user_id || 'OWN-AUTHENTICATED'
      setNewOwner(ownerId)
    } catch (err) {
      toast.error(err?.message || 'Invalid or expired OTP code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Forgot Password - Step 1: Send OTP
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
      if (error) throw error
      toast.success('Reset code sent! Check your email.')
      setMode('forgot-otp')
      setResendCooldown(60)
    } catch (err) {
      toast.error(err?.message || 'Could not send reset code. Please check the email.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Forgot Password - Step 2: Verify OTP
  const handleForgotOtpVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      setErrors({ otp: 'Please enter a 6-digit code' })
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: 'recovery',
      })
      if (error) throw error
      toast.success('Code verified! Enter your new password.')
      setMode('reset-password')
    } catch (err) {
      toast.error(err?.message || 'Invalid or expired reset code.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Forgot Password - Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) throw error
      toast.success('Password updated! You can now log in.')
      setMode('login')
      setPassword('')
    } catch (err) {
      toast.error(err?.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async (type) => {
    if (resendCooldown > 0) return
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
        })
        if (error) throw error
        toast.success('New verification code sent!')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
        if (error) throw error
        toast.success('New reset code sent!')
      }
      setResendCooldown(60)
    } catch (err) {
      toast.error(err?.message || 'Failed to resend code.')
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setErrors({})
    setOtp('')
    setPassword('')
    setNewPassword('')
  }

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

            {/* ── 1. Owner ID reveal after verified registration ── */}
            {newOwner ? (
              <motion.div key="owner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <OwnerIdCard ownerId={newOwner} onContinue={() => navigate('/dashboard')} />
              </motion.div>
            ) : mode === 'otp' ? (

              /* ── 2. Email OTP Verification Screen (Registration) ── */
              <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 16, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyRound size={24} style={{ color: '#00e5ff' }} />
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                    Verify Your Email
                  </h2>
                  <p style={{ color: '#6b7a8d', fontSize: '0.82rem' }}>
                    We sent a 6-digit code to <span style={{ color: '#00e5ff' }}>{email}</span>
                  </p>
                </div>

                <form onSubmit={handleOtpVerify}>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                  {errors.otp && <p style={{ color: '#f43f5e', fontSize: '0.75rem', textAlign: 'center', marginBottom: 12 }}>{errors.otp}</p>}

                  <button type="submit" disabled={loading || otp.length < 6} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                    cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                    opacity: (loading || otp.length < 6) ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 24px rgba(0,229,255,0.2)',
                  }}>
                    {loading ? 'Verifying...' : <><ShieldCheck size={16} /> Verify & Complete Setup</>}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8rem', color: '#6b7a8d' }}>
                  {resendCooldown > 0 ? (
                    <span>Resend code in <strong style={{ color: '#00e5ff' }}>{resendCooldown}s</strong></span>
                  ) : (
                    <button onClick={() => handleResendOtp('signup')} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <RefreshCw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                <button onClick={() => switchMode('signup')} style={{ width: '100%', background: 'none', border: 'none', color: '#6b7a8d', cursor: 'pointer', marginTop: 16, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Back to Registration
                </button>
              </motion.div>

            ) : mode === 'forgot' ? (

              /* ── 3. Forgot Password Screen (Email entry) ── */
              <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                    Reset Password
                  </h2>
                  <p style={{ color: '#4a5568', fontSize: '0.82rem' }}>
                    Enter your registered email and we'll send you an OTP code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit}>
                  <AuthField id="email" label="Email Address" type="email" value={email} onChange={v => { setEmail(v); setErrors(p=>({...p,email:''})) }} placeholder="you@example.com" icon={Mail} error={errors.email} autoComplete="email" />

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 8,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 24px rgba(0,229,255,0.2)',
                  }}>
                    {loading ? 'Sending Code...' : <><Mail size={16} /> Send Reset Code</>}
                  </button>
                </form>

                <button onClick={() => switchMode('login')} style={{ width: '100%', background: 'none', border: 'none', color: '#6b7a8d', cursor: 'pointer', marginTop: 20, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </motion.div>

            ) : mode === 'forgot-otp' ? (

              /* ── 4. Forgot Password OTP Verification ── */
              <motion.div key="forgot-otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 52, height: 52, margin: '0 auto 12px', borderRadius: 16, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyRound size={24} style={{ color: '#00e5ff' }} />
                  </div>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                    Enter Reset Code
                  </h2>
                  <p style={{ color: '#6b7a8d', fontSize: '0.82rem' }}>
                    Enter the code sent to <span style={{ color: '#00e5ff' }}>{email}</span>
                  </p>
                </div>

                <form onSubmit={handleForgotOtpVerify}>
                  <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                  {errors.otp && <p style={{ color: '#f43f5e', fontSize: '0.75rem', textAlign: 'center', marginBottom: 12 }}>{errors.otp}</p>}

                  <button type="submit" disabled={loading || otp.length < 6} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 12,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                    cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                    opacity: (loading || otp.length < 6) ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 24px rgba(0,229,255,0.2)',
                  }}>
                    {loading ? 'Verifying...' : <><Check size={16} /> Verify Reset Code</>}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8rem', color: '#6b7a8d' }}>
                  {resendCooldown > 0 ? (
                    <span>Resend code in <strong style={{ color: '#00e5ff' }}>{resendCooldown}s</strong></span>
                  ) : (
                    <button onClick={() => handleResendOtp('recovery')} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                      <RefreshCw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                <button onClick={() => switchMode('forgot')} style={{ width: '100%', background: 'none', border: 'none', color: '#6b7a8d', cursor: 'pointer', marginTop: 16, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ArrowLeft size={13} /> Back
                </button>
              </motion.div>

            ) : mode === 'reset-password' ? (

              /* ── 5. Set New Password Screen ── */
              <motion.div key="reset-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                    New Password
                  </h2>
                  <p style={{ color: '#4a5568', fontSize: '0.82rem' }}>
                    Choose a secure password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword}>
                  <AuthField id="newPassword" label="New Password" type="password" value={newPassword} onChange={v => { setNewPassword(v); setErrors(p=>({...p,newPassword:''})) }} placeholder="Min. 6 characters" icon={Lock} error={errors.newPassword} autoComplete="new-password" />

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 8,
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', color: '#04060f', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 0 24px rgba(0,229,255,0.2)',
                  }}>
                    {loading ? 'Saving...' : <><Check size={16} /> Save New Password</>}
                  </button>
                </form>
              </motion.div>

            ) : (

              /* ── 6. Normal Login / Signup Form ── */
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

                <form onSubmit={handleAuthSubmit} noValidate>
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

                  {/* Forgot Password Link */}
                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 14 }}>
                      <button type="button" onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: '#00e5ff', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '14px', borderRadius: 14, marginTop: 4,
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
          Protected by HMAC-SHA256 watermarking · Supabase Auth
        </p>
      </div>
    </div>
  )
}

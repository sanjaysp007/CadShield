import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Cpu, Fingerprint, Shield, Scan } from 'lucide-react'

const STEPS = [
  { label: 'Parsing Geometry',      icon: Scan,        color: '#00e5ff', detail: 'Reading mesh topology and vertex buffers…' },
  { label: 'Generating Signature',  icon: Fingerprint, color: '#8b5cf6', detail: 'Computing HMAC-SHA256 ownership signature…' },
  { label: 'Embedding Watermark',   icon: Cpu,         color: '#00e5ff', detail: 'Applying sub-millimetre vertex perturbations…' },
  { label: 'Validating Integrity',  icon: Shield,      color: '#22c55e', detail: 'Verifying model integrity and distortion metrics…' },
]

export default function ProcessingAnimation({ onComplete, duration = 4000 }) {
  const [step,   setStep]   = useState(0)
  const [done,   setDone]   = useState([])
  const [pct,    setPct]    = useState(0)

  useEffect(() => {
    const stepDur = duration / STEPS.length
    const start   = Date.now()
    let stepIdx   = 0

    const advance = () => {
      if (stepIdx >= STEPS.length) { setPct(100); setTimeout(() => onComplete?.(), 500); return }
      setStep(stepIdx)
      const t = setTimeout(() => {
        setDone(p => [...p, stepIdx])
        stepIdx++
        advance()
      }, stepDur)
      return t
    }
    advance()

    const pctIntvl = setInterval(() => {
      const p = Math.min(((Date.now() - start) / duration) * 100, 97)
      setPct(p)
    }, 60)

    return () => clearInterval(pctIntvl)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36, padding: '32px 0' }}>

      {/* Animated shield */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Orbit rings */}
        {[80, 100, 120].map((s, i) => (
          <motion.div
            key={i}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 4 + i * 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: s, height: s,
              marginTop: -s/2, marginLeft: -s/2,
              borderRadius: '50%',
              border: `1px ${i % 2 === 0 ? 'solid' : 'dashed'} rgba(0,229,255,${0.25 - i * 0.06})`,
            }}
          />
        ))}
        {/* Center icon */}
        <div style={{
          position: 'absolute', inset: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,229,255,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(0,229,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,229,255,0.25)',
        }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
            <Shield size={28} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
          </motion.div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.78rem', color: '#4a5568', fontWeight: 500 }}>Processing watermark…</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#00e5ff' }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #00e5ff, #8b5cf6)' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Step list */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((s, i) => {
          const isDone = done.includes(i)
          const isCur  = step === i && !isDone
          const Icon   = s.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.25 }}
              animate={{ opacity: isDone || isCur ? 1 : 0.25 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 14,
                background: isCur ? 'rgba(0,229,255,0.04)' : 'transparent',
                border: isCur ? '1px solid rgba(0,229,255,0.12)' : '1px solid transparent',
                transition: 'all 0.3s',
              }}
            >
              {/* Icon bubble */}
              <div style={{
                width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                background: isDone ? 'rgba(34,197,94,0.12)' : `${s.color}12`,
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : `${s.color}25`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check size={15} style={{ color: '#22c55e' }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="i"
                      animate={isCur ? { rotate: [0, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Icon size={15} style={{ color: isDone ? '#22c55e' : s.color }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.85rem', fontWeight: 600,
                  color: isDone ? '#22c55e' : isCur ? '#f0f4ff' : '#374151',
                  transition: 'color 0.3s',
                }}>
                  {s.label}
                </p>
                {isCur && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: 2 }}>
                    {s.detail}
                  </motion.p>
                )}
              </div>

              {isDone && (
                <motion.span
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                    color: '#22c55e', padding: '2px 8px', borderRadius: 99,
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                  }}
                >
                  DONE
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

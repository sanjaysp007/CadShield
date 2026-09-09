import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Shield, Lock, CheckCircle, Cpu, Fingerprint,
  Upload, ArrowRight, AlertTriangle, Printer,
  ChevronRight, Activity, Zap, Star, Globe
} from 'lucide-react'

/* ── Animated particle canvas ───────────────────────── */
function ParticleField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, W, H, particles = []

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth
      H = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#00e5ff' : '#8b5cf6',
        alpha: Math.random() * 0.5 + 0.1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      // Connect nearby particles
      ctx.globalAlpha = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.strokeStyle = particles[i].color
            ctx.globalAlpha = (1 - d/100) * 0.12
            ctx.lineWidth = 0.6
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}

/* ── Floating 3D Orb + Cube scene ───────────────────── */
function HeroVisual() {
  return (
    <div style={{ position: 'relative', width: '100%', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Orbit rings */}
      {[
        { size: 320, color: 'rgba(0,229,255,0.12)', duration: 14, borderStyle: 'solid' },
        { size: 240, color: 'rgba(139,92,246,0.10)', duration: 10, borderStyle: 'dashed' },
        { size: 160, color: 'rgba(236,72,153,0.08)', duration: 7, borderStyle: 'solid' },
      ].map((ring, i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: ring.size, height: ring.size,
            borderRadius: '50%',
            border: `1px ${ring.borderStyle} ${ring.color}`,
          }}
        />
      ))}

      {/* Central shield orb */}
      <motion.div
        animate={{ y: [0, -14, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'relative', zIndex: 2 }}
      >
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(0,229,255,0.25), rgba(139,92,246,0.2) 50%, rgba(4,6,15,0.9) 80%)',
          border: '1px solid rgba(0,229,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(0,229,255,0.25), 0 0 120px rgba(0,229,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          <Shield size={48} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.8))' }} />
        </div>
      </motion.div>

      {/* Floating orbit dots */}
      {[
        { angle: 0,   r: 140, icon: Lock,        color: '#00e5ff', label: 'Embed' },
        { angle: 72,  r: 140, icon: CheckCircle,  color: '#22c55e', label: 'Verify' },
        { angle: 144, r: 140, icon: AlertTriangle,color: '#f59e0b', label: 'Detect' },
        { angle: 216, r: 140, icon: Fingerprint,  color: '#8b5cf6', label: 'Auth' },
        { angle: 288, r: 140, icon: Activity,     color: '#ec4899', label: 'Score' },
      ].map((dot, i) => {
        const rad = (dot.angle * Math.PI) / 180
        const x = Math.cos(rad) * dot.r
        const y = Math.sin(rad) * dot.r
        const Icon = dot.icon
        return (
          <motion.div
            key={i}
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', transformOrigin: `${-x}px ${-y}px` }}
            initial={{ x, y }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, delay: i * 0.6, repeat: Infinity }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `radial-gradient(circle, ${dot.color}22, transparent)`,
                border: `1px solid ${dot.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 16px ${dot.color}40`,
              }}
            >
              <Icon size={16} style={{ color: dot.color }} />
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Feature card ────────────────────────────────────── */
const FEATURES = [
  { icon: Lock,          color: '#00e5ff', title: 'Secure Watermarking',      desc: 'HMAC-SHA256 signatures embedded as imperceptible vertex perturbations in the mesh topology.' },
  { icon: Fingerprint,   color: '#8b5cf6', title: 'Ownership Protection',     desc: 'Cryptographically bind designer name, owner ID, copyright and timestamps to your model.' },
  { icon: AlertTriangle, color: '#f59e0b', title: 'Tamper Detection',         desc: 'Detect vertex modifications, geometry alterations, and watermark corruption with precision.' },
  { icon: CheckCircle,   color: '#22c55e', title: 'Model Authentication',     desc: 'Extract embedded watermarks and verify ownership from any protected 3D model file.' },
  { icon: Printer,       color: '#00e5ff', title: 'Print Quality Preserved',  desc: 'Geometric distortion under 0.1% — watermarked models are physically indistinguishable.' },
  { icon: Activity,      color: '#ec4899', title: 'Security Analytics',       desc: 'Dashboard with distortion maps, robustness scores, and full verification audit trails.' },
]

/* ── Flow step ───────────────────────────────────────── */
const FLOW = [
  { n: '01', icon: Upload,      label: 'Upload Model',      sub: 'STL · OBJ · PLY · OFF' },
  { n: '02', icon: Fingerprint, label: 'Add Ownership',     sub: 'ID · Name · Copyright' },
  { n: '03', icon: Shield,      label: 'Embed Watermark',   sub: 'HMAC-SHA256 signing' },
  { n: '04', icon: CheckCircle, label: 'Verify Anytime',    sub: 'Authenticate + Detect' },
]

/* ── Stat counter ────────────────────────────────────── */
function StatNumber({ value, label, color = '#00e5ff' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '2.2rem', fontWeight: 800,
        color, filter: `drop-shadow(0 0 12px ${color}60)`,
      }}>{value}</div>
      <div style={{ color: '#4a5568', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'CADShield – Secure 3D Model Watermarking & Authentication'
  }, [])

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <div style={{ background: '#04060f', minHeight: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        {/* Backgrounds */}
        <div style={{ position: 'absolute', inset: 0 }} className="hero-grid" />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-20%', left: '-5%',
            width: '60%', height: '70%',
            background: 'radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 65%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-10%',
            width: '50%', height: '60%',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 65%)',
          }} />
        </div>
        <ParticleField />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', paddingTop: 80, paddingBottom: 60 }}
               className="grid-cols-1 lg:grid-cols-2">

            {/* Left */}
            <div>
              <motion.div {...fadeUp(0.05)}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px',
                  background: 'rgba(0,229,255,0.06)',
                  border: '1px solid rgba(0,229,255,0.18)',
                  borderRadius: 99, marginBottom: 28,
                  fontSize: '0.75rem', fontWeight: 600, color: '#00e5ff',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <Zap size={11} />
                  Research Prototype · Academic Demonstration
                </div>
              </motion.div>

              <motion.h1 {...fadeUp(0.1)} style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                fontWeight: 800, lineHeight: 1.08, marginBottom: 24,
                letterSpacing: '-0.03em',
              }}>
                <span style={{ color: '#f0f4ff' }}>Secure Your 3D</span>
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #8b5cf6 50%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  Designs Before
                </span>
                <br />
                <span style={{ color: '#f0f4ff' }}>They Print.</span>
              </motion.h1>

              <motion.p {...fadeUp(0.18)} style={{
                color: '#6b7a8d', fontSize: '1.05rem', lineHeight: 1.75,
                maxWidth: 480, marginBottom: 36,
              }}>
                Embed cryptographic watermarks into CAD/mesh models. Prove ownership, detect
                tampering, and authenticate 3D files with{' '}
                <span style={{ color: '#00e5ff' }}>HMAC-SHA256</span> signatures.
              </motion.p>

              <motion.div {...fadeUp(0.25)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(0,229,255,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/embed')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '14px 28px', borderRadius: 14,
                    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                    color: '#04060f', fontWeight: 700, fontSize: '0.92rem',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 0 30px rgba(0,229,255,0.2)',
                  }}
                >
                  <Upload size={15} />
                  Upload CAD Model
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04, borderColor: 'rgba(0,229,255,0.6)', boxShadow: '0 0 20px rgba(0,229,255,0.15)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/verify')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '14px 28px', borderRadius: 14,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f0f4ff', fontWeight: 600, fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle size={15} />
                  Verify Model
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/dashboard')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '14px 24px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: '#8892a4', fontWeight: 600, fontSize: '0.92rem',
                    cursor: 'pointer',
                  }}
                >
                  <Activity size={15} />
                  Dashboard
                  <ArrowRight size={13} />
                </motion.button>
              </motion.div>

              {/* Stats row */}
              <motion.div {...fadeUp(0.32)} style={{ display: 'flex', gap: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <StatNumber value="500+" label="Models Protected" color="#00e5ff" />
                <StatNumber value="99.8%" label="Detection Rate" color="#8b5cf6" />
                <StatNumber value="<0.1%" label="Distortion" color="#ec4899" />
              </motion.div>
            </div>

            {/* Right visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <HeroVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE BENTO GRID ────────────────────────── */}
      <section style={{ padding: '100px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <div className="section-divider" />
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 700, color: '#f0f4ff', marginBottom: 16,
              letterSpacing: '-0.02em',
            }}>
              Enterprise-Grade{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Protection</span>
            </h2>
            <p style={{ color: '#6b7a8d', maxWidth: 520, margin: '0 auto', fontSize: '1rem', lineHeight: 1.7 }}>
              Every feature engineered for maximum 3D intellectual property protection.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                className="glass-glow"
              >
                <div
                  className="glass-glow-inner card-hover"
                  style={{ padding: '28px 24px', borderRadius: 19, cursor: 'default', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${f.color}18, ${f.color}08)`,
                    border: `1px solid ${f.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20, boxShadow: `0 0 20px ${f.color}18`,
                  }}>
                    <f.icon size={22} style={{ color: f.color, filter: `drop-shadow(0 0 6px ${f.color}80)` }} />
                  </div>
                  <h3 style={{ color: '#f0f4ff', fontWeight: 650, fontSize: '1rem', marginBottom: 10, letterSpacing: '-0.01em' }}>
                    {f.title}
                  </h3>
                  <p style={{ color: '#5c6a7a', fontSize: '0.85rem', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'rgba(7,10,23,0.6)', position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, transparent, rgba(0,229,255,0.02), transparent)',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <div className="section-divider" />
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '2.2rem', fontWeight: 700, color: '#f0f4ff',
              letterSpacing: '-0.02em',
            }}>
              How{' '}
              <span style={{
                background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>It Works</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, alignItems: 'start' }} className="grid grid-cols-2 lg:grid-cols-4">
            {FLOW.map((step, i) => (
              <div key={step.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: [0.34,1.56,0.64,1] }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', textAlign: 'center' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 20,
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16, position: 'relative',
                    boxShadow: '0 0 30px rgba(0,229,255,0.08)',
                  }}>
                    <step.icon size={26} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.7))' }} />
                    <div style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 22, height: 22, borderRadius: 7,
                      background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 800, color: '#04060f',
                    }}>{step.n}</div>
                  </div>
                  <div style={{ fontWeight: 650, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 6 }}>{step.label}</div>
                  <div style={{ color: '#4a5568', fontSize: '0.76rem', letterSpacing: '0.04em' }}>{step.sub}</div>
                </motion.div>
                {i < FLOW.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 32, left: '75%',
                    width: '50%', height: 1,
                    background: 'linear-gradient(90deg, rgba(0,229,255,0.3), rgba(139,92,246,0.2))',
                  }} className="hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ─────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
              padding: '48px 40px', borderRadius: 28,
              background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(139,92,246,0.08))',
              border: '1px solid rgba(0,229,255,0.12)',
              boxShadow: '0 0 80px rgba(0,229,255,0.06), 0 0 160px rgba(139,92,246,0.04)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -60, right: -60,
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(0,229,255,0.1), transparent)',
              borderRadius: '50%',
            }} />
            <Shield size={40} style={{ color: '#00e5ff', filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.8))', marginBottom: 20 }} />
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.8rem', fontWeight: 700, color: '#f0f4ff',
              marginBottom: 12, letterSpacing: '-0.02em',
            }}>
              Ready to Protect Your Designs?
            </h2>
            <p style={{ color: '#6b7a8d', marginBottom: 32, fontSize: '0.95rem' }}>
              Upload your first model and embed a watermark in under 30 seconds.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,229,255,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/embed')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '14px 32px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                  color: '#04060f', fontWeight: 700, fontSize: '0.95rem',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <Upload size={16} />
                Start Free Demo
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── DISCLAIMER ─────────────────────────────────── */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="prototype-banner" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong style={{ color: '#fbbf24', display: 'block', marginBottom: 4 }}>
                ⚠️ Research Prototype — Academic Demonstration
              </strong>
              <span style={{ fontSize: '0.82rem', lineHeight: 1.7 }}>
                CADShield demonstrates vertex LSB perturbation watermarking with HMAC-SHA256.
                This is an educational proof-of-concept — <strong>not production cryptographic security.</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} style={{ color: '#00e5ff' }} />
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
            background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>CADShield</span>
          <span style={{ color: '#2d3748', fontSize: '0.8rem' }}>· Academic Project · 2024</span>
        </div>
      </footer>
    </div>
  )
}

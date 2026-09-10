import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Fingerprint, CheckCircle, AlertTriangle,
  Activity, Percent, RefreshCw, Lock, Eye, TrendingUp, Zap,
  User, FolderLock, Plus, ShieldCheck, LogOut, Settings,
  ChevronDown, Copy, Check, ExternalLink, Download, Mail, ShieldAlert
} from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { getDashboardStats, getModels, getMyProjects, getVerificationHistory, downloadWatermarkedModel, getAssetUrl } from '../utils/api'
import { getUser, logout } from '../utils/auth'
import { supabase } from '../utils/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
)

/* ── Shared chart theme ─────────────────────────────── */
const TOOLTIP = {
  backgroundColor: 'rgba(7,10,23,0.98)',
  borderColor: 'rgba(0,229,255,0.2)', borderWidth: 1,
  titleColor: '#00e5ff', bodyColor: '#8892a4',
  padding: 12, cornerRadius: 10,
  titleFont: { family: 'Space Grotesk', weight: 700 },
  bodyFont:  { family: 'Inter', size: 12 },
}
const GRID  = { color: 'rgba(255,255,255,0.04)' }
const TICKS = { color: '#4a5568', font: { size: 10, family: 'Inter' } }
const LEGEND = { labels: { color: '#6b7a8d', font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 16 } }

/* ── Stat Card ─────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, color, suffix = '', decimal = 0 }) {
  const [disp, setDisp] = useState(0)

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0
    const duration = 1200
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisp(target * eased)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  const colors = {
    cyan:   { bg: 'rgba(0,229,255,0.08)',   icon: '#00e5ff',  border: 'rgba(0,229,255,0.15)'   },
    purple: { bg: 'rgba(139,92,246,0.08)',  icon: '#a78bfa',  border: 'rgba(139,92,246,0.15)'  },
    green:  { bg: 'rgba(34,197,94,0.08)',   icon: '#22c55e',  border: 'rgba(34,197,94,0.15)'   },
    red:    { bg: 'rgba(244,63,94,0.08)',   icon: '#f43f5e',  border: 'rgba(244,63,94,0.15)'   },
    amber:  { bg: 'rgba(245,158,11,0.08)',  icon: '#f59e0b',  border: 'rgba(245,158,11,0.15)'  },
    blue:   { bg: 'rgba(59,130,246,0.08)',  icon: '#60a5fa',  border: 'rgba(59,130,246,0.15)'  },
  }[color] || {}

  return (
    <div className="glass hover-card" style={{ padding: '16px 18px', borderRadius: 16, borderColor: colors.border }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.72rem', color: '#6b7a8d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color: colors.icon }} />
        </div>
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.45rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
        {decimal > 0 ? disp.toFixed(decimal) : Math.round(disp).toLocaleString()}{suffix}
      </div>
    </div>
  )
}

function buildLineData(records = []) {
  const days = 14
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  // Count real verifications and tampering per day from verification records
  const verificationsPerDay = new Array(days).fill(0)
  const tamperingPerDay = new Array(days).fill(0)

  if (Array.isArray(records) && records.length > 0) {
    records.forEach(r => {
      if (!r.verified_at) return
      const rDate = new Date(r.verified_at)
      const diffDays = Math.floor((Date.now() - rDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays < days) {
        const idx = days - 1 - diffDays
        if (idx >= 0 && idx < days) {
          verificationsPerDay[idx] += 1
          if (r.is_tampered) tamperingPerDay[idx] += 1
        }
      }
    })
  }

  return {
    labels,
    datasets: [
      {
        label: 'Verifications',
        data: verificationsPerDay,
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0,229,255,0.05)',
        tension: 0.45, fill: true, pointRadius: 3,
        pointBackgroundColor: '#00e5ff', pointBorderColor: '#04060f', pointBorderWidth: 2,
      },
      {
        label: 'Tampering',
        data: tamperingPerDay,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.05)',
        tension: 0.45, fill: true, pointRadius: 3,
        pointBackgroundColor: '#f43f5e', pointBorderColor: '#04060f', pointBorderWidth: 2,
      },
    ],
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [models, setModels] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [lineData, setLineData] = useState(() => buildLineData([]))
  const [user, setUser] = useState(() => getUser() || {})
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Listen to profile updates
  useEffect(() => {
    document.title = 'Dashboard – CADShield'
    const syncUser = () => setUser(getUser() || {})
    window.addEventListener('cadshield-user-updated', syncUser)
    return () => window.removeEventListener('cadshield-user-updated', syncUser)
  }, [])

  const load = async () => {
    try {
      const [s, m, p, v] = await Promise.all([
        getDashboardStats(),
        getModels(),
        getMyProjects(),
        getVerificationHistory(),
      ])
      setStats(s)
      setModels(m.slice(0, 5))
      setMyProjects(p || [])
      setLineData(buildLineData(v || []))
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()

    // ── Realtime subscription to Supabase changes ─────────────
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const copyId = () => {
    const id = user.user_id || user.owner_id || ''
    if (id) {
      navigator.clipboard.writeText(id)
      setCopied(true)
      toast.success('User ID copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const verifiedCount = stats?.verified ?? 0
  const tamperedCount = stats?.tampered ?? 0
  const totalCount = stats?.total_models ?? 0
  const otherCount = Math.max(0, totalCount - verifiedCount - tamperedCount)

  const donutData = {
    labels: ['Authenticated', 'Tampered', 'Uploaded'],
    datasets: [{
      data: (totalCount === 0 && verifiedCount === 0 && tamperedCount === 0)
        ? [0, 0, 0]
        : [verifiedCount, tamperedCount, otherCount],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(244,63,94,0.8)', 'rgba(0,229,255,0.7)'],
      borderColor: ['#22c55e', '#f43f5e', '#00e5ff'],
      borderWidth: 1, hoverOffset: 6,
    }],
  }

  const BASE_OPTS = (extra = {}) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { tooltip: TOOLTIP, legend: LEGEND, ...extra },
  })

  const photoSrc = getAssetUrl(user?.profile_photo)

  const initials = (user?.full_name || 'CAD User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

          {/* Top Bar with Header & Profile Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.9rem', fontWeight: 800, color: '#f0f4ff',
                  letterSpacing: '-0.02em', marginBottom: 4,
                }}
              >
                Security{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Dashboard</span>
              </motion.h1>
              <p style={{ color: '#4a5568', fontSize: '0.82rem' }}>
                {format(new Date(), "MMMM d, yyyy · 'UTC+5:30'")}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setRefreshing(true); load() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#6b7a8d', fontSize: '0.8rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={13} style={{ animation: refreshing ? 'rotate-slow 1s linear infinite' : 'none' }} />
                Refresh
              </button>

              {/* Profile Menu Dropdown Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '6px 14px 6px 8px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(0,229,255,0.25)',
                    cursor: 'pointer', boxShadow: '0 0 16px rgba(0,229,255,0.1)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    overflow: 'hidden', border: '1px solid rgba(0,229,255,0.4)',
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(139,92,246,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 800, color: '#00e5ff' }}>
                        {initials}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2 }}>
                      {user.full_name?.split(' ')[0] || 'Account'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#00e5ff', fontFamily: 'monospace', lineHeight: 1.2 }}>
                      {user.user_id || user.owner_id}
                    </div>
                  </div>
                  <ChevronDown size={14} style={{ color: '#6b7a8d', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        width: 220, zIndex: 100,
                        background: 'rgba(11,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16, padding: '8px', backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                      }}
                    >
                      <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <User size={15} style={{ color: '#00e5ff' }} /> Profile
                        </div>
                      </Link>

                      <Link to="/my-projects" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <FolderLock size={15} style={{ color: '#a78bfa' }} /> My Projects
                        </div>
                      </Link>

                      <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Settings size={15} style={{ color: '#f59e0b' }} /> Settings
                        </div>
                      </Link>

                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                      <button
                        onClick={logout}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10, border: 'none',
                          background: 'rgba(244,63,94,0.08)', color: '#f43f5e',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>

          {/* ── USER PROFILE HERO BANNER ──────────────── */}
          <GlassCard glow="cyan" style={{ padding: '24px 28px', marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>

              {/* Identity Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  overflow: 'hidden', border: '2px solid rgba(0,229,255,0.4)',
                  background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(0,229,255,0.25)', flexShrink: 0,
                }}>
                  {photoSrc ? (
                    <img src={photoSrc} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#00e5ff' }}>
                      {initials}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.45rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
                      {user.full_name || 'CAD Creator'}
                    </h2>
                    <span style={{
                      padding: '2px 8px', borderRadius: 99,
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22c55e', fontSize: '0.68rem', fontWeight: 700,
                    }}>
                      AUTHENTICATED
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, flexWrap: 'wrap', color: '#8892a4', fontSize: '0.82rem' }}>
                    {/* User ID Tag */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                      <span style={{ fontSize: '0.68rem', color: '#6b7a8d', textTransform: 'uppercase' }}>User ID:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#00e5ff' }}>
                        {user.user_id || user.owner_id || 'OWN-UNKNOWN'}
                      </span>
                      <button onClick={copyId} style={{ background: 'none', border: 'none', color: copied ? '#22c55e' : '#6b7a8d', cursor: 'pointer', padding: 2 }} title="Copy User ID">
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Email */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Mail size={13} style={{ color: '#6b7a8d' }} /> {user.email || 'user@cadshield.com'}
                    </span>

                    {/* Total Projects */}
                    <span style={{ color: '#f0f4ff', fontWeight: 600 }}>
                      Total Projects: <span style={{ color: '#00e5ff' }}>{myProjects.length}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/embed" style={{ textDecoration: 'none' }}>
                  <NeonButton icon={Plus} size="sm">
                    Upload CAD Project
                  </NeonButton>
                </Link>

                <Link to="/verify-project" style={{ textDecoration: 'none' }}>
                  <NeonButton variant="secondary" icon={ShieldCheck} size="sm">
                    Verify Project
                  </NeonButton>
                </Link>

                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <NeonButton variant="ghost" icon={User} size="sm">
                    My Profile
                  </NeonButton>
                </Link>

                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10,
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                    color: '#f43f5e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>

            </div>
          </GlassCard>

          {/* Stats bento */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 20 }}
               className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard title="Protected"   value={stats?.total_models ?? 0}        icon={Shield}        color="cyan"   />
            <StatCard title="Watermarked" value={stats?.watermarks_embedded ?? 0} icon={Fingerprint}   color="purple" />
            <StatCard title="Verified"    value={stats?.verified ?? 0}            icon={CheckCircle}   color="green"  />
            <StatCard title="Tampered"    value={stats?.tampered ?? 0}            icon={AlertTriangle} color="red"    />
            <StatCard title="Avg Integrity" value={stats?.avg_integrity ?? 0}     icon={Activity}      color="amber"  suffix="%" decimal={1} />
            <StatCard title="Verify Rate" value={stats?.verification_rate ?? 0}   icon={Percent}      color="blue"   suffix="%" decimal={1} />
          </div>

          {/* Charts row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}
               className="grid grid-cols-1 lg:grid-cols-5">

            <div className="glass" style={{ padding: '24px', gridColumn: 'span 3', borderRadius: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 650, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 2 }}>Verification Activity</div>
                  <div style={{ color: '#4a5568', fontSize: '0.75rem' }}>Last 14 days</div>
                </div>
                <div className="badge badge-cyan"><Zap size={10} /> Live</div>
              </div>
              <div style={{ height: 230 }}>
                <Line
                  data={lineData}
                  options={BASE_OPTS({
                    scales: {
                      x: { grid: GRID, ticks: TICKS },
                      y: { grid: GRID, ticks: TICKS, beginAtZero: true },
                    },
                  })}
                />
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', gridColumn: 'span 2', borderRadius: 20 }}>
              <div style={{ fontWeight: 650, color: '#f0f4ff', fontSize: '0.95rem', marginBottom: 4 }}>Model Status</div>
              <div style={{ color: '#4a5568', fontSize: '0.75rem', marginBottom: 16 }}>Current distribution</div>
              <div style={{ height: 210 }}>
                <Doughnut data={donutData} options={BASE_OPTS({ cutout: '65%' })} />
              </div>
            </div>
          </div>

          {/* ── MY RECENT CAD PROJECTS ──────────────── */}
          <div className="glass" style={{ padding: '24px', borderRadius: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#f0f4ff', fontSize: '1.05rem', marginBottom: 2 }}>
                  My Recent CAD Projects
                </h3>
                <p style={{ color: '#4a5568', fontSize: '0.78rem' }}>
                  CAD projects uploaded and authenticated under your User ID
                </p>
              </div>

              <Link to="/my-projects" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '0.8rem', color: '#00e5ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All ({myProjects.length}) <ExternalLink size={13} />
                </span>
              </Link>
            </div>

            {myProjects.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6b7a8d' }}>
                <FolderLock size={32} style={{ color: '#4a5568', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.85rem' }}>No CAD projects yet. Click "Upload CAD Project" to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#4a5568', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>PROJECT NAME</th>
                      <th style={{ padding: '10px 14px' }}>PROJECT ID</th>
                      <th style={{ padding: '10px 14px' }}>STATUS</th>
                      <th style={{ padding: '10px 14px' }}>INTEGRITY</th>
                      <th style={{ padding: '10px 14px' }}>CREATED</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProjects.slice(0, 5).map((p, idx) => (
                      <tr key={p.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f0f4ff' }}>
                          {p.project_name || p.name}
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#00e5ff' }}>
                          {p.project_id || 'PRJ-PENDING'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                            background: p.status === 'watermarked' ? 'rgba(0,229,255,0.1)' : 'rgba(34,197,94,0.1)',
                            color: p.status === 'watermarked' ? '#00e5ff' : '#22c55e',
                          }}>
                            {p.status || 'UPLOADED'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#22c55e', fontWeight: 600 }}>
                          {p.integrity_score ? `${p.integrity_score}%` : '100%'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#6b7a8d' }}>
                          {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : 'Recent'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <Link to={`/verify-project?id=${p.project_id}`} style={{ textDecoration: 'none' }}>
                              <button style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '0.75rem', cursor: 'pointer' }}>
                                Verify
                              </button>
                            </Link>
                            <Link to="/viewer" style={{ textDecoration: 'none' }}>
                              <button style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#8892a4', fontSize: '0.75rem', cursor: 'pointer' }}>
                                View
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

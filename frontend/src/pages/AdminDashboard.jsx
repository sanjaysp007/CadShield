import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Users, ShieldCheck, UserCheck, Search,
  RefreshCw, Copy, Check, Calendar, Phone, Mail, ArrowLeft,
  Lock, AlertTriangle, ExternalLink, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getAdminUsers, getAssetUrl } from '../utils/api'
import { getUser, isAdmin } from '../utils/auth'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const currentUser = getUser() || {}
  const authorized = isAdmin()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [copiedId, setCopiedId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    document.title = 'Admin Dashboard – CADShield'
    if (authorized) {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [authorized])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getAdminUsers()
      setUsers(data || [])
    } catch (err) {
      console.error('Failed to load admin users:', err)
      toast.error(err?.message || 'Failed to fetch registered users from Supabase')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const copyUserId = (id) => {
    if (!id) return
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success('User ID copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Filter users based on search term & role
  const filteredUsers = users.filter(u => {
    const term = query.toLowerCase()
    const matchesQuery = !query ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.user_id && u.user_id.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term))

    const matchesRole = roleFilter === 'ALL' ||
      (u.role && u.role.toUpperCase() === roleFilter)

    return matchesQuery && matchesRole
  })

  // Metrics
  const totalCount = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount = users.filter(u => u.role !== 'admin').length

  // If user is not an admin, render sleek Access Denied view
  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 110, paddingBottom: 64, position: 'relative' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard glow="red" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f43f5e', margin: '0 auto 20px',
                boxShadow: '0 0 30px rgba(244,63,94,0.2)'
              }}>
                <ShieldAlert size={32} />
              </div>

              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#f0f4ff', marginBottom: 10 }}>
                Access Denied: Admin Only
              </h2>

              <p style={{ color: '#8892a4', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                The Admin Dashboard is restricted to authorized administrative users with the <strong style={{ color: '#f43f5e' }}>admin</strong> role.
                Your current account (<span style={{ color: '#00e5ff' }}>{currentUser.email || 'Current User'}</span>) does not have administrative permissions.
              </p>

              <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 28, textAlign: 'left', fontSize: '0.8rem', color: '#6b7a8d' }}>
                <div style={{ fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>How to gain admin access:</div>
                Execute in your Supabase SQL Editor:
                <pre style={{ margin: '8px 0 0', padding: '8px 10px', background: '#070a17', borderRadius: 8, color: '#00e5ff', fontFamily: 'monospace', overflowX: 'auto' }}>
                  UPDATE public.profiles SET role = 'admin' WHERE email = '{currentUser.email || 'your-email@example.com'}';
                </pre>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <NeonButton size="lg" icon={ArrowLeft}>
                    Back to User Dashboard
                  </NeonButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64, position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Back navigation */}
        <div style={{ marginBottom: 20 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6b7a8d', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              <ShieldCheck size={13} /> Authorized Administration
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Admin <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
            </h1>
            <p style={{ color: '#6b7a8d', fontSize: '0.88rem' }}>
              View and audit all registered users stored securely in Supabase with Row Level Security. Passwords are never stored or exposed.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setRefreshing(true); loadUsers() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#8892a4', fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'rotate-slow 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }} className="grid grid-cols-1 sm:grid-cols-3">
          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7a8d', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered Users</span>
              <Users size={18} style={{ color: '#00e5ff' }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#f0f4ff' }}>
              {loading ? '...' : totalCount}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7a8d', textTransform: 'uppercase', fontWeight: 600 }}>Administrators</span>
              <ShieldCheck size={18} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>
              {loading ? '...' : adminCount}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7a8d', textTransform: 'uppercase', fontWeight: 600 }}>Standard Users</span>
              <UserCheck size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
              {loading ? '...' : userCount}
            </div>
          </GlassCard>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by Name, Email, User ID, or Phone..."
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 16px 12px 42px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 3 }}>
            {['ALL', 'ADMIN', 'USER'].map(st => (
              <button
                key={st}
                onClick={() => setRoleFilter(st)}
                style={{
                  padding: '8px 16px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: roleFilter === st ? 'rgba(0,229,255,0.12)' : 'transparent',
                  color: roleFilter === st ? '#00e5ff' : '#6b7a8d',
                  boxShadow: roleFilter === st ? 'inset 0 0 0 1px rgba(0,229,255,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: '#6b7a8d' }}>
              <RefreshCw size={28} style={{ animation: 'rotate-slow 1s linear infinite', color: '#00e5ff', margin: '0 auto 12px' }} />
              <div>Fetching registered users from Supabase...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', color: '#6b7a8d' }}>
              <Users size={36} style={{ color: '#374151', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>No users found</div>
              <div style={{ fontSize: '0.82rem' }}>No user matches the filter criteria or no profiles exist yet.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#6b7a8d', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ padding: '14px 20px' }}>User</th>
                    <th style={{ padding: '14px 16px' }}>User ID</th>
                    <th style={{ padding: '14px 16px' }}>Email</th>
                    <th style={{ padding: '14px 16px' }}>Role</th>
                    <th style={{ padding: '14px 16px' }}>Phone</th>
                    <th style={{ padding: '14px 20px' }}>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, idx) => {
                    const initials = (u.name || u.full_name || u.email || 'U')
                      .split(' ')
                      .map(p => p[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()

                    const photoSrc = getAssetUrl(u.profile_photo)
                    const isRowAdmin = u.role === 'admin'

                    return (
                      <tr
                        key={u.id || idx}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar & Name */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              overflow: 'hidden', border: '1px solid rgba(0,229,255,0.25)',
                              background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(139,92,246,0.1))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {photoSrc ? (
                                <img src={photoSrc} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#00e5ff' }}>
                                  {initials}
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 650, color: '#f0f4ff' }}>
                              {u.name || u.full_name || 'Anonymous User'}
                            </div>
                          </div>
                        </td>

                        {/* User ID */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#00e5ff', fontWeight: 600 }}>
                              {u.user_id || u.id}
                            </span>
                            <button
                              onClick={() => copyUserId(u.user_id || u.id)}
                              style={{ background: 'none', border: 'none', color: copiedId === (u.user_id || u.id) ? '#22c55e' : '#4a5568', cursor: 'pointer', padding: 2 }}
                              title="Copy User ID"
                            >
                              {copiedId === (u.user_id || u.id) ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                          {u.email}
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                            background: isRowAdmin ? 'rgba(34,197,94,0.12)' : 'rgba(0,229,255,0.08)',
                            color: isRowAdmin ? '#22c55e' : '#00e5ff',
                            border: `1px solid ${isRowAdmin ? 'rgba(34,197,94,0.3)' : 'rgba(0,229,255,0.2)'}`
                          }}>
                            {u.role || 'user'}
                          </span>
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '14px 16px', color: u.phone ? '#94a3b8' : '#4a5568' }}>
                          {u.phone || '—'}
                        </td>

                        {/* Registration Date */}
                        <td style={{ padding: '14px 20px', color: '#6b7a8d', fontSize: '0.78rem' }}>
                          {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : 'Recent'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  )
}

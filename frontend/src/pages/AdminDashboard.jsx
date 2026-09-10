import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, Users, ShieldCheck, UserCheck, Search,
  RefreshCw, Copy, Check, Calendar, Phone, Mail, ArrowLeft,
  Lock, AlertTriangle, ExternalLink, Sparkles, Layers, Activity,
  FileCheck, UserPlus, UserMinus, Building2, BarChart2, Eye
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getAdminUsers, updateUserRole, getAdminInsights, getAdminAllModels, getAssetUrl } from '../utils/api'
import { getUser, isAdmin, isMainAdmin } from '../utils/auth'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const currentUser = getUser() || {}
  const authorized = isAdmin()
  const currentIsMainAdmin = isMainAdmin()

  const [activeTab, setActiveTab] = useState('users') // 'users' | 'insights' | 'models'
  const [users, setUsers] = useState([])
  const [insights, setInsights] = useState({
    totalUsers: 0, adminUsers: 0, standardUsers: 0,
    totalModels: 0, watermarkedModels: 0, totalVerifications: 0,
    tamperedDetected: 0, avgIntegrity: 0
  })
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [copiedId, setCopiedId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    document.title = 'Admin Dashboard – CADShield'
    if (authorized) {
      loadAllData()
    } else {
      setLoading(false)
    }
    const reload = () => { if (authorized) loadAllData() }
    window.addEventListener('cadshield-projects-updated', reload)
    return () => window.removeEventListener('cadshield-projects-updated', reload)
  }, [authorized])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [uData, iData, mData] = await Promise.all([
        getAdminUsers().catch(() => []),
        getAdminInsights().catch(() => ({})),
        getAdminAllModels().catch(() => [])
      ])
      setUsers(uData || [])
      if (iData && Object.keys(iData).length > 0) setInsights(iData)
      setModels(mData || [])
    } catch (err) {
      console.error('Failed to load admin data:', err)
      toast.error('Failed to fetch real data from Supabase')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRoleToggle = async (targetUser) => {
    if (!currentIsMainAdmin) {
      toast.error('Only the Main Administrator can promote or demote administrators.')
      return
    }
    if (targetUser.role === 'main_admin') {
      toast.error('The Main Administrator is protected and cannot be modified or demoted.')
      return
    }
    if (targetUser.id === currentUser.id) {
      toast.error('You cannot change your own admin role.')
      return
    }
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin'
    setUpdatingId(targetUser.id)
    try {
      setUsers(prev => prev.map(u => (u.id === targetUser.id || u.user_id === targetUser.user_id) ? { ...u, role: newRole } : u))
      await updateUserRole(targetUser.id, newRole)
      toast.success(`User ${targetUser.name || targetUser.email} role updated to ${newRole.toUpperCase()}!`)
      loadAllData()
    } catch (err) {
      toast.error(err?.message || 'Failed to update user role in Supabase')
    } finally {
      setUpdatingId(null)
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

    const uRole = (u.role || 'user').toUpperCase()
    const matchesRole = roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' ? (uRole === 'ADMIN' || uRole === 'MAIN_ADMIN') : uRole === roleFilter)

    return matchesQuery && matchesRole
  })

  // Metrics
  const totalCount = users.length
  const mainAdminCount = users.filter(u => u.role === 'main_admin').length
  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount = users.filter(u => u.role !== 'admin' && u.role !== 'main_admin').length

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

              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                The Admin Dashboard is restricted to authorized administrative users with the <strong style={{ color: '#f43f5e' }}>admin</strong> role.
                Your current account (<span style={{ color: '#00e5ff' }}>{currentUser.email || 'Current User'}</span>) does not have administrative permissions.
              </p>

              <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 28, textAlign: 'left', fontSize: '0.8rem', color: '#94a3b8' }}>
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
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 88, paddingBottom: 64, position: 'relative' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }} className="px-3 sm:px-6">

        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 99,
              background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700, marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              <ShieldCheck size={13} /> Authorized Administration
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Admin <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5 }}>
              Full administrative view into registered users, authentic database statistics, and registered CADShield projects.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => { setRefreshing(true); loadAllData() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5e1', fontSize: '0.82rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'rotate-slow 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {[
            { id: 'users', label: `Users (${users.length})`, icon: Users },
            { id: 'insights', label: 'Platform Insights', icon: Activity },
            { id: 'models', label: `Projects & Files (${models.length})`, icon: Layers },
          ].map(t => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontWeight: 650, fontSize: '0.85rem', transition: 'all 0.2s', flexShrink: 0,
                  whiteSpace: 'nowrap',
                  background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.02)',
                  color: active ? '#00e5ff' : '#94a3b8',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(0,229,255,0.3)' : 'none',
                }}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* ── TAB 1: USERS MANAGEMENT ────────────────────────── */}
        {activeTab === 'users' && (
          <div>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <GlassCard style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered Users</span>
                  <Users size={18} style={{ color: '#00e5ff' }} />
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#f0f4ff' }}>
                  {loading ? '...' : totalCount}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Administrators</span>
                  <ShieldCheck size={18} style={{ color: '#22c55e' }} />
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>
                  {loading ? '...' : (mainAdminCount + adminCount)}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Standard Users</span>
                  <UserCheck size={18} style={{ color: '#a78bfa' }} />
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
                  {loading ? '...' : userCount}
                </div>
              </GlassCard>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220, width: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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

              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 3, flexShrink: 0 }}>
                {['ALL', 'ADMIN', 'USER'].map(st => (
                  <button
                    key={st}
                    onClick={() => setRoleFilter(st)}
                    style={{
                      padding: '8px 16px', borderRadius: 9, fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                      background: roleFilter === st ? 'rgba(0,229,255,0.12)' : 'transparent',
                      color: roleFilter === st ? '#00e5ff' : '#94a3b8',
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
                <div style={{ padding: '64px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw size={28} style={{ animation: 'rotate-slow 1s linear infinite', color: '#00e5ff', margin: '0 auto 12px' }} />
                  <div>Fetching registered users from Supabase...</div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '64px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <Users size={36} style={{ color: '#64748b', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>No users found</div>
                  <div style={{ fontSize: '0.82rem' }}>No user matches the filter criteria or no profiles exist yet.</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={{ padding: '14px 20px' }}>User</th>
                        <th style={{ padding: '14px 16px' }}>Owner / User ID</th>
                        <th style={{ padding: '14px 16px' }}>Email</th>
                        <th style={{ padding: '14px 16px' }}>Role</th>
                        <th style={{ padding: '14px 16px' }}>Organization</th>
                        <th style={{ padding: '14px 16px' }}>Registered</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>Manage</th>
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
                        const isRowMainAdmin = u.role === 'main_admin'
                        const isRowAdmin = u.role === 'admin'
                        const isSelf = u.id === currentUser.id

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
                                <div>
                                  <div style={{ fontWeight: 650, color: '#f0f4ff' }}>
                                    {u.name || u.full_name || 'Anonymous User'}
                                    {isSelf && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: '#00e5ff', background: 'rgba(0,229,255,0.1)', padding: '2px 6px', borderRadius: 6 }}>You</span>}
                                  </div>
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
                                  style={{ background: 'none', border: 'none', color: copiedId === (u.user_id || u.id) ? '#22c55e' : '#94a3b8', cursor: 'pointer', padding: 2 }}
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
                              {isRowMainAdmin ? (
                                <span style={{
                                  padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                                  background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.4)',
                                  display: 'inline-flex', alignItems: 'center', gap: 4
                                }}>
                                  <ShieldCheck size={11} /> Main Admin
                                </span>
                              ) : isRowAdmin ? (
                                <span style={{
                                  padding: '3px 9px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                                  background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)'
                                }}>
                                  Admin
                                </span>
                              ) : (
                                <span style={{
                                  padding: '3px 9px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                                  background: 'rgba(0,229,255,0.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)'
                                }}>
                                  User
                                </span>
                              )}
                            </td>

                            {/* Organization */}
                            <td style={{ padding: '14px 16px', color: u.college_company ? '#cbd5e1' : '#94a3b8' }}>
                              {u.college_company || '—'}
                            </td>

                            {/* Registration Date */}
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.78rem' }}>
                              {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : 'Recent'}
                            </td>

                            {/* Action: Manage Role */}
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              {isRowMainAdmin ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700,
                                  background: 'rgba(168,85,247,0.08)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)'
                                }}>
                                  <ShieldCheck size={12} /> Protected
                                </span>
                              ) : currentIsMainAdmin ? (
                                !isSelf ? (
                                  <button
                                    disabled={updatingId === u.id}
                                    onClick={() => handleRoleToggle(u)}
                                    style={{
                                      padding: '5px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, cursor: updatingId === u.id ? 'not-allowed' : 'pointer',
                                      border: isRowAdmin ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(34,197,94,0.3)',
                                      background: isRowAdmin ? 'rgba(244,63,94,0.08)' : 'rgba(34,197,94,0.08)',
                                      color: isRowAdmin ? '#f43f5e' : '#22c55e',
                                      transition: 'all 0.2s',
                                    }}
                                  >
                                    {updatingId === u.id ? 'Saving...' : isRowAdmin ? 'Demote to User' : 'Promote to Admin'}
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>You (Main Admin)</span>
                                )
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                  {isSelf ? 'You (Admin)' : 'Main Admin Managed'}
                                </span>
                              )}
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
        )}

        {/* ── TAB 2: REAL APPLICATION INSIGHTS ────────────────── */}
        {activeTab === 'insights' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <GlassCard style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Total Platform Users
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#00e5ff' }}>
                  {insights.totalUsers}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
                  {insights.adminUsers} admin{insights.adminUsers === 1 ? '' : 's'}, {insights.standardUsers} standard
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Protected CAD Models
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>
                  {insights.totalModels}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
                  {insights.watermarkedModels} embedded with HMAC-SHA256
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Verifications Executed
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>
                  {insights.totalVerifications}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
                  Authenticity checks logged
                </div>
              </GlassCard>

              <GlassCard style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                  Tampered Incidents
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: insights.tamperedDetected > 0 ? '#f43f5e' : '#22c55e' }}>
                  {insights.tamperedDetected}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>
                  {insights.tamperedDetected === 0 ? 'No tampering detected' : 'Unauthorized modifications'}
                </div>
              </GlassCard>
            </div>

            <GlassCard style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 12 }}>
                Real-Time Security Metrics
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 20 }}>
                These metrics reflect actual records stored in Supabase with Row Level Security.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Average Model Integrity</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#00e5ff' }}>
                    {insights.avgIntegrity > 0 ? `${insights.avgIntegrity.toFixed(1)}%` : 'No data yet'}
                  </div>
                </div>
                <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Database Storage State</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#22c55e' }}>
                    Connected
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── TAB 3: PLATFORM PROJECTS & FILES ────────────────── */}
        {activeTab === 'models' && (
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                  Registered 3D Models & Files
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
                  Audited list of actual CAD projects protected across the platform.
                </p>
              </div>
            </div>

            {models.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <Layers size={36} style={{ color: '#64748b', margin: '0 auto 12px' }} />
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>No models or projects registered yet</div>
                <div style={{ fontSize: '0.82rem' }}>When users upload or watermark 3D models, they will appear here in real time.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ padding: '14px 20px' }}>Model / File Name</th>
                      <th style={{ padding: '14px 16px' }}>Owner ID</th>
                      <th style={{ padding: '14px 16px' }}>Format</th>
                      <th style={{ padding: '14px 16px' }}>Status</th>
                      <th style={{ padding: '14px 16px' }}>Integrity</th>
                      <th style={{ padding: '14px 20px' }}>Registered Date</th>
                      <th style={{ padding: '14px 16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m, idx) => (
                      <tr key={m.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: '#f0f4ff' }}>
                          {m.project_name || m.name || m.original_filename || m.filename || 'Untitled Model'}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#00e5ff' }}>
                          {m.owner_id || m.user_id || m.creator_user_id || '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textTransform: 'uppercase', color: '#a78bfa', fontWeight: 600, fontSize: '0.75rem' }}>
                          {m.file_format || m.format || 'STL'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                            background: m.status === 'watermarked' ? 'rgba(0,229,255,0.1)' : 'rgba(34,197,94,0.1)',
                            color: m.status === 'watermarked' ? '#00e5ff' : '#22c55e',
                            border: `1px solid ${m.status === 'watermarked' ? 'rgba(0,229,255,0.25)' : 'rgba(34,197,94,0.25)'}`
                          }}>
                            {m.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#22c55e', fontWeight: 600 }}>
                          {m.integrity_score ? `${m.integrity_score}%` : '100%'}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: '0.78rem' }}>
                          {m.created_at ? format(new Date(m.created_at), 'MMM d, yyyy') : 'Recent'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link to={`/viewer?id=${encodeURIComponent(m.id || '')}&projectId=${encodeURIComponent(m.project_id || '')}`} style={{ textDecoration: 'none' }}>
                              <button style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                                background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)',
                                color: '#00e5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <Eye size={12} /> 3D View
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
          </GlassCard>
        )}

      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, Lock, CheckCircle,
  FolderLock, History, Menu, X, Eye, LogOut,
  ChevronDown, Copy, Check, User, Settings, ShieldCheck, ShieldAlert,
  Bell, BellRing, MessageSquare, ExternalLink, Box, CheckCheck, Globe
} from 'lucide-react'
import { format } from 'date-fns'
import { getUser, logout, syncCurrentUserRole } from '../utils/auth'
import {
  getAssetUrl,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../utils/api'

function NotificationBell({ user }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const bellRef = useRef(null)

  const loadNotifications = async () => {
    if (!user) return
    try {
      const notifs = await getUserNotifications(user)
      setNotifications(notifs || [])
      setUnreadCount((notifs || []).filter(n => !n.is_read).length)
    } catch (_) {}
  }

  useEffect(() => {
    loadNotifications()
    const onUpdate = () => loadNotifications()
    window.addEventListener('cadshield-notifications-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    const timer = setInterval(loadNotifications, 7000)

    return () => {
      window.removeEventListener('cadshield-notifications-updated', onUpdate)
      window.removeEventListener('storage', onUpdate)
      clearInterval(timer)
    }
  }, [user?.user_id, user?.owner_id, user?.email, user?.id])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [open])

  const handleMarkOne = async (id, e) => {
    if (e) e.stopPropagation()
    await markNotificationAsRead(id)
    loadNotifications()
  }

  const handleMarkAll = async (e) => {
    if (e) e.stopPropagation()
    await markAllNotificationsAsRead(user)
    loadNotifications()
  }

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Notifications from CadShield Team"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 12,
          background: unreadCount > 0 ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: unreadCount > 0 ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: unreadCount > 0 ? '#00e5ff' : '#94a3b8',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: unreadCount > 0 ? '0 0 15px rgba(0,229,255,0.2)' : 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'
          e.currentTarget.style.color = '#00e5ff'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = unreadCount > 0 ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = unreadCount > 0 ? '#00e5ff' : '#94a3b8'
        }}
      >
        {unreadCount > 0 ? (
          <BellRing size={17} style={{ color: '#00e5ff' }} />
        ) : (
          <Bell size={17} />
        )}

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3,
            minWidth: 17, height: 17, borderRadius: 99,
            background: 'linear-gradient(135deg, #ef4444, #f43f5e)',
            color: '#fff', fontSize: '0.62rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', boxShadow: '0 0 10px rgba(239,68,68,0.7)',
            border: '2px solid #04060f',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: 380, maxWidth: 'calc(100vw - 24px)', zIndex: 250,
              background: 'rgba(9,13,26,0.98)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: 16, backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,229,255,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(0,229,255,0.06), transparent)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={13} style={{ color: '#00e5ff' }} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.88rem', fontWeight: 800, color: '#f0f4ff', margin: 0 }}>
                    CadShield Team
                  </h4>
                  <span style={{ fontSize: '0.66rem', color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                    Official Advisories
                  </span>
                </div>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '4px 8px', color: '#94a3b8', fontSize: '0.7rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00e5ff'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 12px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                    color: '#64748b'
                  }}>
                    <Bell size={20} />
                  </div>
                  <p style={{ color: '#f0f4ff', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4 }}>
                    No notifications yet
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.74rem', margin: 0, lineHeight: 1.4 }}>
                    Official announcements and CAD project advisories from CadShield Team will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {notifications.map(notif => {
                    const isUnread = !notif.is_read
                    const typeColor = {
                      alert: '#f43f5e',
                      advisory: '#00e5ff',
                      verification: '#22c55e',
                      update: '#a78bfa',
                    }[notif.type] || '#00e5ff'

                    return (
                      <div
                        key={notif.id}
                        style={{
                          padding: '12px', borderRadius: 12,
                          background: isUnread ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
                          border: isUnread ? '1px solid rgba(0,229,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Sender & Date row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: '0.64rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6,
                              background: 'rgba(0,229,255,0.15)', color: typeColor,
                              border: `1px solid ${typeColor}40`, textTransform: 'uppercase'
                            }}>
                              🛡️ {notif.sender_name || 'CadShield Team'}
                            </span>
                            {isUnread && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
                            )}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {notif.created_at ? format(new Date(notif.created_at), 'MMM d, h:mm a') : 'Recent'}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>
                          {notif.title}
                        </div>

                        {/* Message body */}
                        <p style={{
                          fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45,
                          margin: '0 0 8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}>
                          {notif.message}
                        </p>

                        {/* Attached CAD Project chip */}
                        {(notif.project_id || notif.project_name) && (
                          <div style={{ marginBottom: 8 }}>
                            <Link
                              to={`/viewer?id=${encodeURIComponent(notif.project_id || '')}&projectId=${encodeURIComponent(notif.project_id || '')}`}
                              onClick={() => {
                                handleMarkOne(notif.id)
                                setOpen(false)
                              }}
                              style={{ textDecoration: 'none' }}
                            >
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 10px', borderRadius: 8,
                                background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
                                color: '#00e5ff', fontSize: '0.72rem', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.18)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                              >
                                <Box size={12} />
                                <span>CAD Project: {notif.project_name || notif.project_id}</span>
                                <ExternalLink size={10} />
                              </div>
                            </Link>
                          </div>
                        )}

                        {/* Actions */}
                        {isUnread && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => handleMarkOne(notif.id, e)}
                              style={{
                                background: 'none', border: 'none', color: '#94a3b8',
                                fontSize: '0.68rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                padding: '2px 4px',
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#22c55e'}
                              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                            >
                              <Check size={11} /> Mark as read
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(4,6,15,0.5)', textAlign: 'center',
            }}>
              <Link
                to="/my-projects"
                onClick={() => setOpen(false)}
                style={{ textDecoration: 'none', color: '#94a3b8', fontSize: '0.72rem' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                View all projects in My Projects &rarr;
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  const copyId = (e) => {
    e.stopPropagation()
    const id = user.user_id || user.owner_id || ''
    if (id) {
      navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [open])

  const photoSrc = getAssetUrl(user?.profile_photo)
  const isAdminUser = user?.role === 'admin' || user?.role === 'main_admin'

  const initials = (user?.full_name || 'CAD User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 12px 5px 6px', borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,229,255,0.25)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
      >
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          overflow: 'hidden', border: '1px solid rgba(0,229,255,0.3)',
          background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(139,92,246,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {photoSrc ? (
            <img src={photoSrc} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', fontWeight: 800, color: '#00e5ff' }}>
              {initials}
            </span>
          )}
        </div>

        <div style={{ textAlign: 'left' }} className="hidden sm:block">
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff', lineHeight: 1.2 }}>
            {user.full_name?.split(' ')[0] || 'User'}
          </div>
          <div style={{ fontSize: '0.66rem', color: '#00e5ff', lineHeight: 1.2, fontFamily: 'monospace' }}>
            {user.user_id || user.owner_id}
          </div>
        </div>
        <ChevronDown size={13} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 250, maxWidth: 'calc(100vw - 24px)', zIndex: 200,
              background: 'rgba(11,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '12px', backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* User info Header */}
            <div style={{ padding: '4px 6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff' }}>{user.full_name}</p>
                {isAdminUser && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                    background: user.role === 'main_admin' ? 'rgba(239,68,68,0.2)' : 'rgba(0,229,255,0.2)',
                    color: user.role === 'main_admin' ? '#f87171' : '#00e5ff',
                    border: `1px solid ${user.role === 'main_admin' ? 'rgba(239,68,68,0.4)' : 'rgba(0,229,255,0.4)'}`,
                  }}>
                    {user.role === 'main_admin' ? 'MAIN ADMIN' : 'ADMIN'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8 }}>{user.email}</p>

              {/* User ID display with copy */}
              <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>User ID</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#00e5ff' }}>
                    {user.user_id || user.owner_id}
                  </span>
                  <button onClick={copyId} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#94a3b8', padding: 2 }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Admin Panel Quick Access (if Admin) */}
            {isAdminUser && (
              <Link to="/admin" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 10px', borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(244,63,94,0.08))',
                  border: '1px solid rgba(239,68,68,0.3)', marginBottom: 8, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(244,63,94,0.08))'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={15} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>Admin Panel</span>
                  </div>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: 99,
                    background: 'rgba(239,68,68,0.25)', color: '#fca5a5', letterSpacing: '0.05em'
                  }}>
                    ENTER &rarr;
                  </span>
                </div>
              </Link>
            )}

            {/* Menu Links */}
            <Link to="/profile" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <User size={15} style={{ color: '#00e5ff' }} /> Profile
              </div>
            </Link>

            <Link to="/my-projects" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <FolderLock size={15} style={{ color: '#a78bfa' }} /> My Projects
              </div>
            </Link>

            <Link to="/profile" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: '#f0f4ff', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.08)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Settings size={15} style={{ color: '#f59e0b' }} /> Settings
              </div>
            </Link>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

            {/* Sign out */}
            <button
              onClick={logout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(244,63,94,0.06)', color: '#f43f5e',
                fontSize: '0.82rem', fontWeight: 600, transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,0.06)'}
            >
              <LogOut size={14} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(() => getUser())

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  // React to profile updates and active role synchronization
  useEffect(() => {
    const syncUser = () => setUser(getUser())
    window.addEventListener('cadshield-user-updated', syncUser)

    // Actively check and synchronize current user's role from Supabase or overrides
    const syncRole = async () => {
      const u = await syncCurrentUserRole()
      if (u) setUser(u)
    }
    syncRole()
    const timer = setInterval(syncRole, 10000)
    window.addEventListener('focus', syncRole)
    window.addEventListener('storage', syncRole)
    window.addEventListener('cadshield-user-role-changed', syncRole)

    return () => {
      window.removeEventListener('cadshield-user-updated', syncUser)
      clearInterval(timer)
      window.removeEventListener('focus', syncRole)
      window.removeEventListener('storage', syncRole)
      window.removeEventListener('cadshield-user-role-changed', syncRole)
    }
  }, [])

  const isAdminUser = user?.role === 'admin' || user?.role === 'main_admin'
  const navItems = [
    { to: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard },
    ...(isAdminUser ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldAlert, isSpecial: true }] : []),
    { to: '/global-search',  label: 'Global Search', icon: Globe },
    { to: '/my-projects',    label: 'My Projects',   icon: FolderLock },
    { to: '/embed',          label: 'Protect',       icon: Lock },
    ...(isAdminUser ? [{ to: '/verify-project', label: 'Verify', icon: ShieldCheck }] : []),
    { to: '/viewer',         label: 'Viewer',        icon: Eye },
    { to: '/history',        label: 'History',       icon: History },
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.4s ease',
        ...(scrolled ? {
          background: 'rgba(4,6,15,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        } : { background: 'transparent' })
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }} style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,229,255,0.15)' }}>
                <Shield size={18} style={{ color: '#00e5ff' }} />
              </motion.div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                CADShield
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center" style={{ gap: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px 6px' }}>
              {navItems.map(({ to, label, icon: Icon, isSpecial }) => {
                const active = pathname === to
                return (
                  <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                    <motion.div whileHover={{ scale: 1.03 }} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: '0.82rem',
                      fontWeight: isSpecial ? 700 : 500, transition: 'all 0.2s',
                      background: active
                        ? (isSpecial ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,255,0.1)')
                        : (isSpecial ? 'rgba(239,68,68,0.08)' : 'transparent'),
                      color: active
                        ? (isSpecial ? '#f87171' : '#00e5ff')
                        : (isSpecial ? '#fca5a5' : '#8892a4'),
                      border: isSpecial ? '1px solid rgba(239,68,68,0.25)' : '1px solid transparent',
                      boxShadow: active ? (isSpecial ? '0 0 12px rgba(239,68,68,0.2)' : '0 0 12px rgba(0,229,255,0.15)') : 'none'
                    }}>
                      <Icon size={13} style={{ color: isSpecial ? '#ef4444' : undefined }} />
                      {label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right side Profile & Mobile hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {user && <NotificationBell user={user} />}
              {user && <UserMenu user={user} />}
              <button onClick={() => setMobileOpen(v => !v)} className="md:hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 8, color: '#8892a4', cursor: 'pointer' }}>
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99, background: 'rgba(7,10,23,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px 20px' }}>
            {navItems.map(({ to, label, icon: Icon, isSpecial }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 4,
                    background: active
                      ? (isSpecial ? 'rgba(239,68,68,0.15)' : 'rgba(0,229,255,0.08)')
                      : (isSpecial ? 'rgba(239,68,68,0.08)' : 'transparent'),
                    color: active
                      ? (isSpecial ? '#f87171' : '#00e5ff')
                      : (isSpecial ? '#fca5a5' : '#8892a4'),
                    border: isSpecial ? '1px solid rgba(239,68,68,0.25)' : 'none',
                    fontSize: '0.9rem', fontWeight: isSpecial ? 700 : 500
                  }}>
                    <Icon size={15} style={{ color: isSpecial ? '#ef4444' : undefined }} />
                    {label}
                  </div>
                </Link>
              )
            })}
            {user && (
              <>
                <Link to="/profile" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 4, color: '#f0f4ff', fontSize: '0.9rem', fontWeight: 500 }}>
                    <User size={15} style={{ color: '#00e5ff' }} /> Profile Settings
                  </div>
                </Link>
                <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'rgba(244,63,94,0.08)', color: '#f43f5e', fontSize: '0.88rem', fontWeight: 600 }}>
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

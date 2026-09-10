import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, Lock, CheckCircle,
  FolderLock, History, Menu, X, Eye, LogOut,
  ChevronDown, Copy, Check, User, Settings, ShieldCheck, ShieldAlert
} from 'lucide-react'
import { getUser, logout } from '../utils/auth'
import { getAssetUrl } from '../utils/api'

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/embed',          label: 'Protect',     icon: Lock },
  { to: '/my-projects',    label: 'My Projects', icon: FolderLock },
  { to: '/verify-project', label: 'Verify',      icon: ShieldCheck },
  { to: '/viewer',         label: 'Viewer',      icon: Eye },
  { to: '/history',        label: 'History',     icon: History },
]

function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

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
    const close = () => setOpen(false)
    if (open) document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const photoSrc = getAssetUrl(user?.profile_photo)

  const initials = (user?.full_name || 'CAD User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div style={{ position: 'relative' }}>
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

        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f0f4ff', lineHeight: 1.2 }}>
            {user.full_name?.split(' ')[0] || 'User'}
          </div>
          <div style={{ fontSize: '0.66rem', color: '#00e5ff', lineHeight: 1.2, fontFamily: 'monospace' }}>
            {user.user_id || user.owner_id}
          </div>
        </div>
        <ChevronDown size={13} style={{ color: '#6b7a8d', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 250, zIndex: 200,
              background: 'rgba(11,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '12px', backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* User info Header */}
            <div style={{ padding: '4px 6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f4ff', marginBottom: 2 }}>{user.full_name}</p>
              <p style={{ fontSize: '0.72rem', color: '#6b7a8d', marginBottom: 8 }}>{user.email}</p>

              {/* User ID display with copy */}
              <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <div style={{ fontSize: '0.62rem', color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>User ID</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: '#00e5ff' }}>
                    {user.user_id || user.owner_id}
                  </span>
                  <button onClick={copyId} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#22c55e' : '#6b7a8d', padding: 2 }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

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

            {user.role === 'admin' && (
              <Link to="/admin" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: '#22c55e', fontSize: '0.82rem', cursor: 'pointer', transition: 'background 0.2s', background: 'rgba(34,197,94,0.06)' }}
                     onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.12)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.06)'}>
                  <ShieldAlert size={15} style={{ color: '#22c55e' }} /> Admin Dashboard
                </div>
              </Link>
            )}

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

  // React to profile updates
  useEffect(() => {
    const syncUser = () => setUser(getUser())
    window.addEventListener('cadshield-user-updated', syncUser)
    return () => window.removeEventListener('cadshield-user-updated', syncUser)
  }, [])

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
            <div className="hidden md:flex" style={{ display: 'none', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '4px 6px' }}>
              {NAV.map(({ to, label, icon: Icon }) => {
                const active = pathname === to
                return (
                  <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                    <motion.div whileHover={{ scale: 1.03 }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s', background: active ? 'rgba(0,229,255,0.1)' : 'transparent', color: active ? '#00e5ff' : '#8892a4', boxShadow: active ? '0 0 12px rgba(0,229,255,0.15)' : 'none' }}>
                      <Icon size={13} />{label}
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right side Profile & Mobile hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 4, background: pathname===to ? 'rgba(0,229,255,0.08)' : 'transparent', color: pathname===to ? '#00e5ff' : '#8892a4', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Icon size={15} />{label}
                </div>
              </Link>
            ))}
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

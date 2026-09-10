import { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import Dashboard          from './pages/Dashboard'
import EmbedPage          from './pages/EmbedPage'
import VerifyPage         from './pages/VerifyPage'
import ViewerPage         from './pages/ViewerPage'
import AnalyticsPage      from './pages/AnalyticsPage'
import HistoryPage        from './pages/HistoryPage'
import ProfilePage        from './pages/ProfilePage'
import MyProjectsPage     from './pages/MyProjectsPage'
import ProjectVerifyPage  from './pages/ProjectVerifyPage'
import CreatorPage        from './pages/CreatorPage'
import AdminDashboard     from './pages/AdminDashboard'
import GlobalSearchPage   from './pages/GlobalSearchPage'
import { isLoggedIn, isAdmin, initSupabaseSession, isSessionReady, waitForSession } from './utils/auth'

// ── Protected route wrapper ───────────────────────────
function Protected({ children }) {
  const [ready, setReady] = useState(() => isSessionReady())
  const [auth, setAuth]   = useState(() => isLoggedIn())

  useEffect(() => {
    const handleUpdate = () => {
      setReady(true)
      setAuth(isLoggedIn())
    }
    window.addEventListener('cadshield-user-updated', handleUpdate)
    window.addEventListener('cadshield-auth-ready', handleUpdate)
    waitForSession().then(() => {
      setReady(true)
      setAuth(isLoggedIn())
    })
    return () => {
      window.removeEventListener('cadshield-user-updated', handleUpdate)
      window.removeEventListener('cadshield-auth-ready', handleUpdate)
    }
  }, [])

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#04060f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(0,229,255,0.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7a8d', fontSize: '0.82rem', fontFamily: "'Space Grotesk', sans-serif" }}>Restoring secure session...</p>
        </div>
      </div>
    )
  }

  return auth ? children : <Navigate to="/login" replace />
}

function AdminProtected({ children }) {
  const [ready, setReady] = useState(() => isSessionReady())
  const [auth, setAuth]   = useState(() => isLoggedIn())
  const [admin, setAdmin] = useState(() => isAdmin())

  useEffect(() => {
    const handleUpdate = () => {
      setReady(true)
      setAuth(isLoggedIn())
      setAdmin(isAdmin())
    }
    window.addEventListener('cadshield-user-updated', handleUpdate)
    window.addEventListener('cadshield-auth-ready', handleUpdate)
    waitForSession().then(() => {
      setReady(true)
      setAuth(isLoggedIn())
      setAdmin(isAdmin())
    })
    return () => {
      window.removeEventListener('cadshield-user-updated', handleUpdate)
      window.removeEventListener('cadshield-auth-ready', handleUpdate)
    }
  }, [])

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: '#04060f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(0,229,255,0.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7a8d', fontSize: '0.82rem', fontFamily: "'Space Grotesk', sans-serif" }}>Restoring secure session...</p>
        </div>
      </div>
    )
  }

  if (!auth) return <Navigate to="/login" replace />
  if (!admin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const location  = useLocation()
  const isPublic  = ['/', '/login'].includes(location.pathname)

  return (
    <>
      {!isPublic && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/"                 element={<LandingPage />} />
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/global-search"    element={<GlobalSearchPage />} />
          <Route path="/creator/:userId"  element={<CreatorPage />} />

          {/* Protected */}
          <Route path="/dashboard"    element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin"        element={<AdminProtected><AdminDashboard /></AdminProtected>} />
          <Route path="/verify-project" element={<AdminProtected><ProjectVerifyPage /></AdminProtected>} />
          <Route path="/verify"       element={<AdminProtected><VerifyPage /></AdminProtected>} />
          <Route path="/profile"      element={<Protected><ProfilePage /></Protected>} />
          <Route path="/my-projects"  element={<Protected><MyProjectsPage /></Protected>} />
          <Route path="/embed"        element={<Protected><EmbedPage /></Protected>} />
          <Route path="/viewer"       element={<Protected><ViewerPage /></Protected>} />
          <Route path="/analytics"    element={<Protected><AnalyticsPage /></Protected>} />
          <Route path="/history"      element={<Protected><HistoryPage /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default function App() {
  const initRef = useRef(false)
  useEffect(() => {
    // Restore and synchronize Supabase authentication session on app initialization
    if (initRef.current) return
    initRef.current = true
    initSupabaseSession()
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13,18,36,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,229,255,0.2)',
            color: '#e2e8f0',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0e1a' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#0a0e1a' } },
        }}
      />
    </BrowserRouter>
  )
}

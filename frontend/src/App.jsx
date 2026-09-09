import { useEffect, useState } from 'react'
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
import { isLoggedIn, initSupabaseSession } from './utils/auth'

// ── Protected route wrapper ───────────────────────────
function Protected({ children }) {
  const [auth, setAuth] = useState(() => isLoggedIn())

  useEffect(() => {
    const handleAuthUpdate = () => setAuth(isLoggedIn())
    window.addEventListener('cadshield-user-updated', handleAuthUpdate)
    return () => window.removeEventListener('cadshield-user-updated', handleAuthUpdate)
  }, [])

  return auth ? children : <Navigate to="/login" replace />
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
          <Route path="/verify-project"   element={<ProjectVerifyPage />} />
          <Route path="/creator/:userId"  element={<CreatorPage />} />

          {/* Protected */}
          <Route path="/dashboard"    element={<Protected><Dashboard /></Protected>} />
          <Route path="/profile"      element={<Protected><ProfilePage /></Protected>} />
          <Route path="/my-projects"  element={<Protected><MyProjectsPage /></Protected>} />
          <Route path="/embed"        element={<Protected><EmbedPage /></Protected>} />
          <Route path="/verify"       element={<Protected><VerifyPage /></Protected>} />
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
  useEffect(() => {
    // Restore and synchronize Supabase authentication session on app initialization
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

import { supabase } from './supabase'

// ── Storage keys ─────────────────────────────────────
const TOKEN_KEY = 'cadshield_token'
const USER_KEY  = 'cadshield_user'

// ── Persist / retrieve ────────────────────────────────
export function saveAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    const normalized = {
      ...user,
      user_id: user.user_id || user.owner_id || 'OWN-UNKNOWN',
      owner_id: user.user_id || user.owner_id || 'OWN-UNKNOWN',
    }
    localStorage.setItem(USER_KEY, JSON.stringify(normalized))
  }
  window.dispatchEvent(new Event('cadshield-user-updated'))
}

export function updateStoredUser(updates) {
  const current = getUser() || {}
  const merged = {
    ...current,
    ...updates,
    user_id: current.user_id || updates.user_id,
    owner_id: current.user_id || updates.user_id,
    email: current.email || updates.email,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(merged))
  window.dispatchEvent(new Event('cadshield-user-updated'))
  return merged
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('cadshield-user-updated'))
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const u = JSON.parse(raw)
    u.user_id = u.user_id || u.owner_id
    u.owner_id = u.user_id
    return u
  } catch {
    return null
  }
}

export function isLoggedIn() {
  const token = getToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp) return payload.exp * 1000 > Date.now()
    return true
  } catch {
    return true
  }
}

/**
 * Log out the user from Supabase and clear local session
 */
export async function logout() {
  try {
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('Supabase signOut error:', err)
  }
  clearAuth()
  window.location.href = '/login'
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Initialize and sync Supabase session on application load.
 * Ensures page refresh keeps the user authenticated.
 */
export async function initSupabaseSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (session && !error) {
      const supaUser = session.user
      const meta = supaUser.user_metadata || {}
      const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
      const existing = getUser() || {}
      const userObj = {
        ...existing,
        id: supaUser.id,
        user_id: user_id,
        owner_id: user_id,
        email: supaUser.email,
        full_name: meta.full_name || existing.full_name || supaUser.email.split('@')[0],
        phone: meta.phone || existing.phone || null,
        college_company: meta.college_company || meta.organization || existing.college_company || null,
        department: meta.department || existing.department || null,
        designation: meta.designation || existing.designation || null,
        location: meta.location || existing.location || null,
        bio: meta.bio || existing.bio || null,
        profile_photo: meta.profile_photo || existing.profile_photo || null,
        created_at: supaUser.created_at,
      }
      saveAuth(session.access_token, userObj)
    }

    // Subscribe to auth state events
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const supaUser = session.user
        const meta = supaUser.user_metadata || {}
        const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
        const existing = getUser() || {}
        const userObj = {
          ...existing,
          id: supaUser.id,
          user_id: user_id,
          owner_id: user_id,
          email: supaUser.email,
          full_name: meta.full_name || existing.full_name || supaUser.email.split('@')[0],
          created_at: supaUser.created_at,
        }
        saveAuth(session.access_token, userObj)
      } else if (event === 'SIGNED_OUT') {
        clearAuth()
      }
    })
  } catch (err) {
    console.warn('Supabase session init error:', err)
  }
}

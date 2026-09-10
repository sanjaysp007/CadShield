import { supabase } from './supabase'

// ── Storage keys ─────────────────────────────────────
const TOKEN_KEY = 'cadshield_token'
const USER_KEY  = 'cadshield_user'

/**
 * Generate a unique, cryptographically random Owner ID in format: OWN-XXXX-XXXX
 */
export function generateOwnerId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let seg1 = ''
  let seg2 = ''

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(8)
    window.crypto.getRandomValues(arr)
    for (let i = 0; i < 4; i++) seg1 += chars[arr[i] % chars.length]
    for (let i = 4; i < 8; i++) seg2 += chars[arr[i] % chars.length]
  } else {
    for (let i = 0; i < 4; i++) seg1 += chars[Math.floor(Math.random() * chars.length)]
    for (let i = 4; i < 8; i++) seg2 += chars[Math.floor(Math.random() * chars.length)]
  }

  return `OWN-${seg1}-${seg2}`
}

export const generateUserId = generateOwnerId

// ── Persist / retrieve ────────────────────────────────
export function saveAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    const normalized = {
      ...user,
      user_id: user.user_id || user.owner_id || 'OWN-UNKNOWN',
      owner_id: user.user_id || user.owner_id || 'OWN-UNKNOWN',
      role: user.role || 'user',
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
    role: updates.role || current.role || 'user',
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
    u.role = u.role || 'user'
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
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      clearAuth()
      return false
    }
    return true
  } catch {
    return true
  }
}

export function isAdmin() {
  const user = getUser()
  return user?.role === 'admin' || user?.role === 'main_admin'
}

export function isMainAdmin() {
  const user = getUser()
  return user?.role === 'main_admin'
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
 * Ensures page refresh keeps the user authenticated and fetches role from profiles table.
 */
export async function initSupabaseSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (session && !error) {
      const supaUser = session.user
      const meta = supaUser.user_metadata || {}
      const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
      const existing = getUser() || {}

      let role = meta.role || existing.role || 'user'

      if (supaUser.email?.toLowerCase() === 'mailtosanjaysp@gmail.com') {
        role = 'main_admin'
      }

      // Attempt to load role and details from Supabase profiles table
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supaUser.id)
          .maybeSingle()

        if (profile) {
          role = supaUser.email?.toLowerCase() === 'mailtosanjaysp@gmail.com' ? 'main_admin' : (profile.role || role)
        } else {
          // If profile does not exist yet, auto-create it non-sensitively
          await supabase.from('profiles').upsert({
            id: supaUser.id,
            user_id: user_id,
            name: meta.full_name || supaUser.email?.split('@')[0],
            email: supaUser.email,
            role: role,
            phone: meta.phone || null,
            profile_photo: meta.profile_photo || null,
            created_at: supaUser.created_at,
          })
        }
      } catch (profileErr) {
        console.warn('Profiles table sync notice:', profileErr?.message)
      }

      // Check role overrides map
      if (supaUser.email?.toLowerCase() !== 'mailtosanjaysp@gmail.com') {
        try {
          const overrides = JSON.parse(localStorage.getItem('cadshield_role_overrides') || '{}')
          const ovRole = overrides[supaUser.email?.toLowerCase()] || overrides[user_id] || overrides[supaUser.id]
          if (ovRole) role = ovRole
        } catch (_) {}
      }

      const userObj = {
        ...existing,
        id: supaUser.id,
        user_id: user_id,
        owner_id: user_id,
        email: supaUser.email,
        role: role,
        full_name: meta.full_name || existing.full_name || supaUser.email?.split('@')[0],
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

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      // During password recovery, do not establish normal login session until password is set
      if (event === 'PASSWORD_RECOVERY') {
        return
      }

      if (session?.user) {
        const supaUser = session.user
        const meta = supaUser.user_metadata || {}
        const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
        const existing = getUser() || {}

        let role = meta.role || existing.role || 'user'
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', supaUser.id)
            .maybeSingle()
        if (profile?.role) role = profile.role
      } catch (_) {}

      // Ensure Main Admin protection
      if (supaUser.email?.toLowerCase() === 'mailtosanjaysp@gmail.com') {
        role = 'main_admin'
        try {
          supabase.from('profiles').update({ role: 'main_admin' }).eq('id', supaUser.id).then(() => {})
        } catch (_) {}
      } else {
        // Check role overrides map
        try {
          const overrides = JSON.parse(localStorage.getItem('cadshield_role_overrides') || '{}')
          const ovRole = overrides[supaUser.email?.toLowerCase()] || overrides[user_id] || overrides[supaUser.id]
          if (ovRole && ovRole !== role) {
            role = ovRole
          }
        } catch (_) {}
      }

      const userObj = {
        ...existing,
        id: supaUser.id,
        user_id: user_id,
        owner_id: user_id,
        email: supaUser.email,
        role: role,
        full_name: meta.full_name || existing.full_name || supaUser.email?.split('@')[0],
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

/**
 * Actively synchronize current user's role from Supabase profiles, role overrides, or local storage.
 * Dispatches 'cadshield-user-updated' if role changed.
 */
export async function syncCurrentUserRole() {
  const cur = getUser()
  if (!cur) return null

  // 1. Permanent Main Admin check
  if (cur.email?.toLowerCase() === 'mailtosanjaysp@gmail.com') {
    if (cur.role !== 'main_admin') {
      return updateStoredUser({ role: 'main_admin' })
    }
    return cur
  }

  // 2. Check local role overrides (for immediate cross-tab or test reflection)
  try {
    const overrides = JSON.parse(localStorage.getItem('cadshield_role_overrides') || '{}')
    const ovRole = overrides[cur.email?.toLowerCase()] || overrides[cur.user_id] || overrides[cur.id]
    if (ovRole && ovRole !== cur.role) {
      return updateStoredUser({ role: ovRole })
    }
  } catch (_) {}

  // 3. Query Supabase profiles table
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cur.id)
    let query = supabase.from('profiles').select('id, user_id, email, role')
    if (isUuid) {
      query = query.eq('id', cur.id)
    } else if (cur.email) {
      query = query.eq('email', cur.email)
    } else if (cur.user_id) {
      query = query.eq('user_id', cur.user_id)
    }
    const { data: prof, error } = await query.maybeSingle()
    if (!error && prof?.role && prof.role !== cur.role) {
      return updateStoredUser({ role: prof.role })
    }
  } catch (_) {}

  return cur
}

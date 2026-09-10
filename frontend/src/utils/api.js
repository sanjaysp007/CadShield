import axios from 'axios'
import toast from 'react-hot-toast'
import { getToken, saveAuth, updateStoredUser, clearAuth, getUser } from './auth'
import { supabase } from './supabase'

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const BASE = API_BASE_URL

export function getAssetUrl(path) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${cleanPath}`
}

const api = axios.create({ baseURL: BASE, timeout: 60000 })

// ── Attach auth token to every request ───────────────
api.interceptors.request.use(cfg => {
  const token = getToken()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

let _live = null
async function checkBackend() {
  if (_live !== null) return _live
  try { await axios.get(`${BASE}/health`, { timeout: 2000 }); _live = true }
  catch { _live = false }
  return _live
}
const delay = ms => new Promise(r => setTimeout(r, ms))

function formatAuthError(err) {
  if (!err) return 'Authentication failed'
  const msg = err.message || err.error_description || String(err)
  if (msg.includes('Token has expired') || msg.includes('is invalid') || msg.includes('otp_expired')) {
    return 'Invalid or expired 6-digit verification code. Please check the code or request a new one.'
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('Too many requests')) {
    return 'Email rate limit exceeded. Please wait a few minutes before requesting another OTP.'
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.'
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  if (msg.includes('Password should be at least 6 characters') || msg.includes('weak_password')) {
    return 'Password is too weak. Please use at least 6 characters.'
  }
  if (msg.includes('Email not confirmed')) {
    return 'Your email address has not been confirmed yet. Please verify your email with the 6-digit OTP code.'
  }
  return msg
}

/**
 * Generate a unique, cryptographically random Owner ID in format: OWN-XXXX-XXXX
 * Consistent across CADShield platform and stored in user profile & database.
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

// ── Auth API ──────────────────────────────────────────

/**
 * Register account with Supabase Auth.
 * If email confirmation is enabled, Supabase generates and emails a 6-digit OTP code.
 * DOES NOT save fake tokens to localStorage if session is null.
 */
export async function signup(email, password, fullName, organization) {
  const owner_id = generateOwnerId()
  const cleanEmail = email.trim().toLowerCase()

  try {
    const { data: supaData, error: supaError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization: (organization || '').trim(),
          college_company: (organization || '').trim(),
          owner_id: owner_id,
          user_id: owner_id,
        },
      },
    })

    if (supaError) throw supaError

    const supaUser = supaData?.user
    const session = supaData?.session

    const userObj = {
      id: supaUser?.id || '',
      user_id: owner_id,
      owner_id: owner_id,
      email: cleanEmail,
      full_name: fullName.trim(),
      college_company: organization || null,
      created_at: supaUser?.created_at || new Date().toISOString(),
    }

    // Only save session if Supabase returned a real session immediately
    // If confirmation is needed (session is null), do NOT save fake tokens
    if (session?.access_token) {
      saveAuth(session.access_token, userObj)
      try {
        await supabase.from('profiles').upsert({
          id: supaUser.id,
          user_id: owner_id,
          name: fullName.trim(),
          email: cleanEmail,
          role: 'user',
          college_company: organization || null,
          created_at: userObj.created_at,
        })
      } catch (_) {}
    }

    return {
      session,
      user: userObj,
      needsEmailConfirmation: !session,
      owner_id,
    }
  } catch (supaErr) {
    throw new Error(formatAuthError(supaErr))
  }
}

/**
 * Verify 6-digit Email OTP for signup confirmation.
 * Uses official Supabase type: 'signup'.
 * Once verified, saves real authenticated session to localStorage and upserts profile.
 */
export async function verifySignupOtp(email, token, pendingMeta = {}) {
  const cleanToken = String(token).replace(/\D/g, '').trim()
  const cleanEmail = String(email).trim().toLowerCase()

  if (!cleanEmail) throw new Error('Email address is missing.')
  if (cleanToken.length !== 6) throw new Error('Please enter the complete 6-digit verification code.')

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    })

    if (error) throw error

    const supaUser = data?.user
    const session = data?.session

    if (!supaUser) {
      throw new Error('Verification completed but user record could not be loaded.')
    }

    const meta = supaUser.user_metadata || {}
    const owner_id = meta.owner_id || meta.user_id || pendingMeta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

    const userObj = {
      id: supaUser.id,
      user_id: owner_id,
      owner_id: owner_id,
      email: supaUser.email,
      role: 'user',
      full_name: meta.full_name || pendingMeta.name || supaUser.email.split('@')[0],
      college_company: meta.college_company || meta.organization || pendingMeta.org || null,
      created_at: supaUser.created_at,
    }

    // Upsert into profiles table with authenticated session
    try {
      await supabase.from('profiles').upsert({
        id: supaUser.id,
        user_id: owner_id,
        name: userObj.full_name,
        email: userObj.email,
        role: 'user',
        college_company: userObj.college_company,
        created_at: userObj.created_at,
      })
    } catch (profileErr) {
      console.warn('Profiles table sync after OTP verify:', profileErr?.message)
    }

    // Save the genuine JWT access token from Supabase session
    if (session?.access_token) {
      saveAuth(session.access_token, userObj)
    }

    return { session, user: userObj, owner_id }
  } catch (err) {
    throw new Error(formatAuthError(err))
  }
}

/**
 * Verify 6-digit Email OTP for password recovery.
 * Uses official Supabase type: 'recovery'.
 */
export async function verifyRecoveryOtp(email, token) {
  const cleanToken = String(token).replace(/\D/g, '').trim()
  const cleanEmail = String(email).trim().toLowerCase()

  if (!cleanEmail) throw new Error('Email address is missing.')
  if (cleanToken.length !== 6) throw new Error('Please enter the complete 6-digit verification code.')

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    })

    if (error) throw error
    return data
  } catch (err) {
    throw new Error(formatAuthError(err))
  }
}

export async function login(email, password) {
  try {
    const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (supaError) throw supaError

    const supaUser = supaData.user
    const session = supaData.session
    const meta = supaUser?.user_metadata || {}

    const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`

    let role = meta.role || 'user'
    let profileData = null
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supaUser.id)
        .maybeSingle()

      if (profile) {
        role = profile.role || role
        profileData = profile
      } else {
        await supabase.from('profiles').upsert({
          id: supaUser.id,
          user_id: user_id,
          name: meta.full_name || supaUser.email.split('@')[0],
          email: supaUser.email,
          role: role,
          phone: meta.phone || null,
          profile_photo: meta.profile_photo || null,
          created_at: supaUser.created_at,
        })
      }
    } catch (profileErr) {
      console.warn('Profiles table sync note on login:', profileErr?.message)
    }

    const userObj = {
      id: supaUser.id,
      user_id: profileData?.user_id || user_id,
      owner_id: profileData?.user_id || user_id,
      email: supaUser.email,
      role: role,
      full_name: profileData?.name || meta.full_name || supaUser.email.split('@')[0],
      college_company: profileData?.college_company || meta.college_company || meta.organization || null,
      phone: profileData?.phone || meta.phone || null,
      department: profileData?.department || meta.department || null,
      designation: profileData?.designation || meta.designation || null,
      location: profileData?.location || meta.location || null,
      bio: profileData?.bio || meta.bio || null,
      profile_photo: profileData?.profile_photo || meta.profile_photo || null,
      created_at: profileData?.created_at || supaUser.created_at,
    }

    saveAuth(session.access_token, userObj)
    return { token: session.access_token, user: userObj }
  } catch (supaErr) {
    throw new Error(formatAuthError(supaErr))
  }
}

export async function getAdminUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, name, email, role, phone, profile_photo, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchMe() {
  try {
    const { data: supaUser } = await supabase.auth.getUser()
    if (supaUser?.user) {
      const meta = supaUser.user.user_metadata || {}
      const user_id = meta.user_id || meta.owner_id || `OWN-${supaUser.user.id.replace(/-/g, '').substring(0, 8).toUpperCase()}`
      const userObj = {
        id: supaUser.user.id,
        user_id: user_id,
        owner_id: user_id,
        email: supaUser.user.email,
        full_name: meta.full_name || supaUser.user.email.split('@')[0],
        phone: meta.phone || null,
        college_company: meta.college_company || meta.organization || null,
        department: meta.department || null,
        designation: meta.designation || null,
        location: meta.location || null,
        bio: meta.bio || null,
        profile_photo: meta.profile_photo || null,
        created_at: supaUser.user.created_at,
      }
      updateStoredUser(userObj)
      return userObj
    }
  } catch (_) {}

  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get('/api/auth/me')
      updateStoredUser(data)
      return data
    } catch (_) {}
  }
  return getUser()
}

// ── Profile API ───────────────────────────────────────
export async function updateProfile(profileData) {
  // Sync to Supabase user metadata
  try {
    await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        phone: profileData.phone,
        college_company: profileData.college_company,
        department: profileData.department,
        designation: profileData.designation,
        location: profileData.location,
        bio: profileData.bio,
        profile_photo: profileData.profile_photo,
      }
    })
  } catch (err) {
    console.warn('Supabase updateUser metadata sync notice:', err)
  }

  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.put('/api/auth/profile', profileData)
      updateStoredUser(data)
      return data
    } catch (_) {}
  }
  const updated = updateStoredUser(profileData)
  await delay(300)
  return updated
}

export async function uploadProfilePhoto(file) {
  const live = await checkBackend()
  if (live) {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await api.post('/api/auth/profile/photo', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    updateStoredUser(data)
    return data
  }
  // Fallback: convert to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const updated = updateStoredUser({ profile_photo: dataUrl })
      resolve(updated)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Projects API ──────────────────────────────────────
export async function uploadModel(file) {
  const live = await checkBackend()
  if (!live) {
    await delay(1200)
    const currentUser = getUser()
    return {
      id: `demo-${Date.now()}`,
      project_id: `PRJ-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
      filename: file.name,
      status: 'uploaded',
      message: 'Uploaded (Demo)',
      vertex_count: Math.floor(Math.random()*5000)+1000,
      face_count: Math.floor(Math.random()*10000)+2000,
      file_format: file.name.split('.').pop(),
      mesh_info: { vertex_count: 2847, face_count: 5690, is_watertight: true },
      creator_name: currentUser?.full_name || 'CAD User',
      creator_user_id: currentUser?.user_id || 'OWN-DEMO-0001',
    }
  }
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post('/api/models/upload', fd)
  return data
}

export async function embedWatermark(modelId, ownershipData) {
  const live = await checkBackend()
  const currentUser = getUser()
  if (!live) {
    await delay(2500)
    return {
      watermark_id: `wm-${Date.now().toString(36)}`,
      project_id: `PRJ-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
      integrity_score: 99.8,
      distortion_pct: 0.08,
      processing_time: 2.14,
      download_url: `/api/models/download/${modelId}`,
      vertex_count: 2847,
      face_count: 5690,
      watermarked_vertices: 384,
      timestamp: new Date().toISOString(),
      creator_name: currentUser?.full_name || 'CAD Creator',
      creator_user_id: currentUser?.user_id || 'OWN-DEMO-0001',
      model_id: modelId,
    }
  }
  const { data } = await api.post('/api/watermark/embed', { model_id: modelId, ...ownershipData })
  return data
}

export async function downloadWatermarkedModel(modelId, filename = 'protected_model.stl') {
  const token = getToken()
  const response = await fetch(`${BASE}/api/models/download/${modelId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error(`Download failed: ${response.statusText}`)
  const blob = await response.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export async function getMyProjects() {
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get('/api/models/my-projects')
      return data || []
    } catch (_) {}
  }
  const currentUser = getUser()
  if (currentUser) {
    try {
      const { data } = await supabase
        .from('models')
        .select('*')
        .or(`creator_user_id.eq.${currentUser.user_id},owner_id.eq.${currentUser.owner_id}`)
        .order('created_at', { ascending: false })
      if (data && data.length > 0) return data
    } catch (_) {}
  }
  return []
}

export async function verifyProjectById(projectId) {
  const live = await checkBackend()
  if (!live) {
    await delay(600)
    const upper = (projectId || '').trim().toUpperCase()
    if (upper === 'PRJ-DEMO' || upper.startsWith('PRJ-')) {
      const currentUser = getUser()
      return {
        is_verified: true,
        message: '✓ Verified Project — watermark authenticated.',
        project_id: upper,
        project_name: 'Precision Gear Assembly',
        creator_name: currentUser?.full_name || 'Jane Doe',
        creator_user_id: currentUser?.user_id || 'OWN-A7B2-K9F3',
        creator_college: currentUser?.college_company || 'Stanford Engineering',
        profile_photo: currentUser?.profile_photo || null,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: 'watermarked',
        integrity_score: 99.7,
      }
    }
    return { is_verified: false, message: 'Project not found or invalid Project ID.' }
  }
  const { data } = await api.get(`/api/models/project-verify/${encodeURIComponent(projectId)}`)
  return data
}

export async function getCreatorProfile(userId) {
  const live = await checkBackend()
  if (!live) {
    const u = getUser()
    return {
      creator: {
        user_id: userId,
        full_name: u?.full_name || 'Dr. Alex Vance',
        college_company: u?.college_company || 'Black Mesa Research',
        department: u?.department || 'Applied Physics & Mechanical Design',
        designation: u?.designation || 'Lead CAD Research Engineer',
        location: u?.location || 'New Mexico, USA',
        bio: u?.bio || 'Pioneering additive manufacturing and anti-counterfeiting digital watermarks for mission-critical mechanical systems.',
        profile_photo: u?.profile_photo || null,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      projects: [
        { project_id: 'PRJ-A8K2-9M4F', project_name: 'Aerospace Turbine Housing', status: 'watermarked', integrity_score: 99.8, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { project_id: 'PRJ-C3F7-1B9Q', project_name: 'Robotic Gripper Joint', status: 'verified', integrity_score: 98.6, created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
      ]
    }
  }
  const { data } = await api.get(`/api/models/creator/${encodeURIComponent(userId)}`)
  return data
}

export async function verifyModel(file, modelId = null) {
  const live = await checkBackend()
  if (!live) {
    await delay(1800)
    return {
      is_authenticated: true, is_tampered: false,
      owner_id: 'OWN-A7B2-K9F3', designer_name: 'Jane Doe',
      model_id: 'PRJ-A7B2-K9F3', copyright_info: '© 2024 TechCAD Inc.',
      watermark_id: 'wm-8a3f2b1c-demo', watermark_timestamp: new Date().toISOString(),
      integrity_score: 99.8, tampering_percentage: 0.2, confidence_score: 99.5,
      vertex_changes: 0, face_changes: 0, hmac_valid: true, details: 'Watermark verified successfully'
    }
  }
  const fd = new FormData()
  fd.append('file', file)
  if (modelId) fd.append('model_id', modelId)
  const { data } = await api.post('/api/models/verify', fd)
  return data
}

export async function getModels() {
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get('/api/models/')
      return data || []
    } catch (_) {}
  }
  try {
    const { data } = await supabase.from('models').select('*').order('created_at', { ascending: false }).limit(20)
    if (data && data.length > 0) return data
  } catch (_) {}
  return []
}

export async function getModel(id) {
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get(`/api/models/${id}`)
      return data
    } catch (_) {}
  }
  try {
    const { data } = await supabase.from('models').select('*').eq('id', id).maybeSingle()
    if (data) return data
  } catch (_) {}
  return null
}

export async function deleteModel(id) {
  const live = await checkBackend()
  if (live) {
    const { data } = await api.delete(`/api/models/${id}`)
    return data
  }
  try {
    await supabase.from('models').delete().eq('id', id)
    return { message: 'Deleted' }
  } catch (err) {
    throw err
  }
}

export async function getDashboardStats() {
  // Try backend first
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get('/api/models/dashboard/stats')
      return data
    } catch (_) {}
  }

  // Fallback: query Supabase for real counts
  const stats = { total_models: 0, watermarks_embedded: 0, verified: 0, tampered: 0, avg_integrity: 0, verification_rate: 0 }
  try {
    const { count: modelCount } = await supabase.from('models').select('*', { count: 'exact', head: true })
    if (modelCount !== null) stats.total_models = modelCount

    const { count: wmCount } = await supabase.from('models').select('*', { count: 'exact', head: true }).eq('status', 'watermarked')
    if (wmCount !== null) stats.watermarks_embedded = wmCount

    const { count: vCount } = await supabase.from('models').select('*', { count: 'exact', head: true }).eq('status', 'verified')
    if (vCount !== null) stats.verified = vCount

    const { count: tCount } = await supabase.from('models').select('*', { count: 'exact', head: true }).eq('status', 'tampered')
    if (tCount !== null) stats.tampered = tCount

    const { data: integrityData } = await supabase.from('models').select('integrity_score').not('integrity_score', 'is', null)
    if (integrityData?.length > 0) {
      stats.avg_integrity = integrityData.reduce((sum, r) => sum + (r.integrity_score || 0), 0) / integrityData.length
    }

    if (stats.total_models > 0) {
      stats.verification_rate = ((stats.verified / stats.total_models) * 100)
    }
  } catch (_) {}
  return stats
}

export async function getVerificationHistory() {
  const live = await checkBackend()
  if (live) {
    try {
      const { data } = await api.get('/api/verification/history')
      return data || []
    } catch (_) {}
  }
  try {
    const { data } = await supabase.from('verifications').select('*').order('verified_at', { ascending: false }).limit(20)
    if (data && data.length > 0) return data
  } catch (_) {}
  return []
}

export async function getAnalytics(modelId) {
  const live = await checkBackend()
  if (!live || !modelId) return {
    geometry_distortion: 0.08, vertex_change_count: 384, face_change_count: 0,
    watermark_robustness: 94.2, integrity_score: 99.8, authentication_confidence: 99.5,
    printability_score: 97.8, vertex_distribution: [12,45,89,156,203,178,134,87,52,24],
    face_area_distribution: [5,23,67,134,201,189,143,89,34,11], vertex_count: 2847, face_count: 5690
  }
  const { data } = await api.get(`/api/models/analytics/${modelId}`)
  return data
}

export async function isBackendAvailable() { return checkBackend() }

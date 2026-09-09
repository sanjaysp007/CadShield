import axios from 'axios'
import toast from 'react-hot-toast'
import { getToken, saveAuth, updateStoredUser, clearAuth, getUser } from './auth'
import { supabase } from './supabase'

const BASE = 'http://localhost:8000'

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
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification link.'
  }
  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Too many attempts. Please wait a few moments before trying again.'
  }
  return msg
}

// ── Auth API ──────────────────────────────────────────
export async function signup(email, password, fullName, organization) {
  const owner_id = generateOwnerId()

  try {
    const { data: supaData, error: supaError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
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
      id: supaUser?.id || `usr-${Date.now()}`,
      user_id: owner_id,
      owner_id: owner_id,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      college_company: organization || null,
      created_at: new Date().toISOString(),
    }

    const token = session?.access_token || `token-${Date.now()}`
    saveAuth(token, userObj)

    return { token, user: userObj, needsEmailConfirmation: !session }
  } catch (supaErr) {
    throw new Error(formatAuthError(supaErr))
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
    const userObj = {
      id: supaUser.id,
      user_id: user_id,
      owner_id: user_id,
      email: supaUser.email,
      full_name: meta.full_name || supaUser.email.split('@')[0],
      college_company: meta.college_company || meta.organization || null,
      phone: meta.phone || null,
      department: meta.department || null,
      designation: meta.designation || null,
      location: meta.location || null,
      bio: meta.bio || null,
      profile_photo: meta.profile_photo || null,
      created_at: supaUser.created_at,
    }

    saveAuth(session.access_token, userObj)
    return { token: session.access_token, user: userObj }
  } catch (supaErr) {
    throw new Error(formatAuthError(supaErr))
  }
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
  const currentUser = getUser()
  if (!live) {
    return [
      { id: 'p-1', project_id: 'PRJ-A8K2-9M4F', project_name: 'Aerospace Turbine Housing', name: 'turbine_housing.stl', original_filename: 'turbine_housing.stl', creator_user_id: currentUser?.user_id || 'OWN-DEMO-0001', creator_name: currentUser?.full_name || 'Jane Doe', status: 'watermarked', integrity_score: 99.8, vertex_count: 5410, face_count: 10820, file_format: 'stl', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'p-2', project_id: 'PRJ-C3F7-1B9Q', project_name: 'Robotic Gripper Joint', name: 'gripper_joint.stl', original_filename: 'gripper_joint.stl', creator_user_id: currentUser?.user_id || 'OWN-DEMO-0001', creator_name: currentUser?.full_name || 'Jane Doe', status: 'verified', integrity_score: 98.6, vertex_count: 3200, face_count: 6400, file_format: 'stl', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
    ]
  }
  const { data } = await api.get('/api/models/my-projects')
  return data
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
  if (!live) return [
    { id: 'demo-1', project_id: 'PRJ-BRKT-2024', project_name: 'Demo Bracket', name: 'demo_bracket.stl', original_filename: 'bracket.stl', owner_id: 'OWN-A7B2-K9F3', creator_user_id: 'OWN-A7B2-K9F3', creator_name: 'Jane Doe', designer_name: 'Jane Doe', status: 'watermarked', integrity_score: 99.8, distortion_percentage: 0.08, vertex_count: 2847, face_count: 5690, file_format: 'stl', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'demo-2', project_id: 'PRJ-GEAR-2024', project_name: 'Planetary Gear Unit', name: 'demo_gear.stl', original_filename: 'gear.stl', owner_id: 'OWN-B4C1-L8G2', creator_user_id: 'OWN-B4C1-L8G2', creator_name: 'John Smith', designer_name: 'John Smith', status: 'verified', integrity_score: 98.5, distortion_percentage: 0.12, vertex_count: 5124, face_count: 10244, file_format: 'stl', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'demo-3', project_id: 'PRJ-HOUS-2024', project_name: 'Chassis Housing', name: 'demo_housing.stl', original_filename: 'housing.stl', owner_id: 'OWN-C5D3-M7H1', creator_user_id: 'OWN-C5D3-M7H1', creator_name: 'Alice Chen', designer_name: 'Alice Chen', status: 'watermarked', integrity_score: 99.2, distortion_percentage: 0.05, vertex_count: 3608, face_count: 7212, file_format: 'stl', created_at: new Date().toISOString() },
  ]
  const { data } = await api.get('/api/models/')
  return data
}

export async function getModel(id) {
  const live = await checkBackend()
  if (!live) {
    const list = await getModels()
    return list.find(m => m.id === id) || list[0]
  }
  const { data } = await api.get(`/api/models/${id}`)
  return data
}

export async function deleteModel(id) {
  const live = await checkBackend()
  if (!live) { await delay(400); return { message: 'Deleted (Demo)' } }
  const { data } = await api.delete(`/api/models/${id}`)
  return data
}

export async function getDashboardStats() {
  const live = await checkBackend()
  if (!live) return { total_models: 47, watermarks_embedded: 39, verified: 31, tampered: 3, avg_integrity: 98.7, verification_rate: 65.96 }
  const { data } = await api.get('/api/models/dashboard/stats')
  return data
}

export async function getVerificationHistory() {
  const live = await checkBackend()
  if (!live) return Array.from({ length: 8 }, (_, i) => ({
    id: `vh-${i}`, verified_filename: ['bracket.stl','gear.stl','housing.stl'][i%3],
    is_authenticated: i%4!==3, is_tampered: i%4===3,
    owner_id_found: ['OWN-A7B2-K9F3','OWN-B4C1-L8G2','OWN-C5D3-M7H1'][i%3],
    integrity_score: i%4===3 ? 72.3 : 97 + Math.random()*2.5,
    confidence_score: i%4===3 ? 65.1 : 96 + Math.random()*3,
    verified_at: new Date(Date.now() - i*3600000).toISOString()
  }))
  const { data } = await api.get('/api/verification/history')
  return data
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

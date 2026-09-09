import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Shield, Phone, Building2, Briefcase,
  MapPin, FileText, Camera, Check, Lock, Save,
  AlertCircle, Sparkles, ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import NeonButton from '../components/NeonButton'
import { getUser } from '../utils/auth'
import { updateProfile, uploadProfilePhoto, fetchMe } from '../utils/api'

export default function ProfilePage() {
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(() => getUser() || {})
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Editable Form State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [collegeCompany, setCollegeCompany] = useState(user?.college_company || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [designation, setDesignation] = useState(user?.designation || '')
  const [location, setLocation] = useState(user?.location || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    document.title = 'My Profile – CADShield'
    // Fetch latest user info from backend
    fetchMe().then(latest => {
      if (latest) {
        setUser(latest)
        setFullName(latest.full_name || '')
        setPhone(latest.phone || '')
        setCollegeCompany(latest.college_company || '')
        setDepartment(latest.department || '')
        setDesignation(latest.designation || '')
        setLocation(latest.location || '')
        setBio(latest.bio || '')
        setProfilePhoto(latest.profile_photo || '')
      }
    })
  }, [])

  // Validation
  const validate = () => {
    const errs = {}
    if (!fullName.trim()) {
      errs.fullName = 'Full Name is required'
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters'
    }

    if (phone && phone.trim().length > 20) {
      errs.phone = 'Phone number must be 20 characters or less'
    }

    if (bio && bio.length > 500) {
      errs.bio = 'Bio cannot exceed 500 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle Save
  const handleSave = async (e) => {
    e?.preventDefault()
    if (!validate()) {
      toast.error('Please fix the validation errors before saving')
      return
    }

    setSaving(true)
    setSavedSuccess(false)
    try {
      const updated = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        college_company: collegeCompany.trim() || null,
        department: department.trim() || null,
        designation: designation.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        profile_photo: profilePhoto || null,
      })

      setUser(updated)
      setSavedSuccess(true)
      toast.success('Profile updated successfully!')
      setTimeout(() => setSavedSuccess(false), 4000)
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // Photo Upload Handler
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5 MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const updated = await uploadProfilePhoto(file)
      setUser(updated)
      if (updated.profile_photo) {
        setProfilePhoto(updated.profile_photo)
      }
      toast.success('Profile photo uploaded!')
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const userInitials = (user.full_name || 'CAD User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const photoSrc = profilePhoto
    ? (profilePhoto.startsWith('http') || profilePhoto.startsWith('data:')
        ? profilePhoto
        : `http://localhost:8000${profilePhoto}`)
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', paddingTop: 96, paddingBottom: 64, position: 'relative' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

        {/* Back Link */}
        <div style={{ marginBottom: 24 }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#6b7a8d', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 6 }}>
            User <span style={{ background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Profile</span>
          </h1>
          <p style={{ color: '#6b7a8d', fontSize: '0.88rem' }}>
            Manage your personal identity, credentials, and institutional affiliation. Your User ID is immutably linked to every CAD model you watermark.
          </p>
        </div>

        {/* Success Alert Banner */}
        <AnimatePresence>
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 18px', borderRadius: 14,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', fontSize: '0.88rem', fontWeight: 600, marginBottom: 24,
              }}
            >
              <Check size={18} /> Changes saved successfully! Your public profile and watermark signatures have been updated.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }} className="grid grid-cols-1 md:grid-cols-3">

            {/* Column 1: Avatar Card */}
            <div style={{ gridColumn: 'span 1' }}>
              <GlassCard glow="cyan" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 16px' }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    overflow: 'hidden', border: '2px solid rgba(0,229,255,0.3)',
                    background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(139,92,246,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 24px rgba(0,229,255,0.15)',
                  }}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.5rem', fontWeight: 800, color: '#00e5ff' }}>
                        {userInitials}
                      </span>
                    )}
                  </div>

                  {/* Camera Upload Button */}
                  <button
                    type="button"
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      position: 'absolute', bottom: 4, right: 4,
                      width: 38, height: 38, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
                      border: '2px solid #04060f', color: '#04060f',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 0 12px rgba(0,229,255,0.4)',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    title="Change Profile Photo"
                  >
                    <Camera size={18} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#f0f4ff', marginBottom: 4 }}>
                  {fullName || 'CAD Creator'}
                </h3>
                <p style={{ color: '#6b7a8d', fontSize: '0.8rem', marginBottom: 14 }}>
                  {designation || collegeCompany || 'Verified Creator'}
                </p>

                {/* Immutable User ID Badge */}
                <div style={{
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.2)',
                  marginBottom: 16, textAlign: 'left',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Permanent User ID
                    </span>
                    <Lock size={12} style={{ color: '#00e5ff' }} />
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', monospace", fontSize: '0.95rem', fontWeight: 800, color: '#f0f4ff' }}>
                    {user.user_id || user.owner_id || 'OWN-UNKNOWN'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#4a5568', marginTop: 4 }}>
                    Unique cryptographic identity
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#4a5568', lineHeight: 1.5 }}>
                  Photos must be JPEG, PNG, or WebP under 5 MB. Stored securely and presented with all your watermarked projects.
                </div>
              </GlassCard>
            </div>

            {/* Column 2: Editable Details */}
            <div style={{ gridColumn: 'span 2' }}>
              <GlassCard style={{ padding: 32 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#f0f4ff' }}>Personal Information</h2>
                    <p style={{ color: '#4a5568', fontSize: '0.78rem' }}>Update your creator details and contact information.</p>
                  </div>
                </div>

                {/* Non-editable Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

                  {/* User ID (Immutable) */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: '#6b7a8d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      User ID <span style={{ color: '#00e5ff', fontSize: '0.7rem' }}>(Non-editable)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        disabled
                        value={user.user_id || user.owner_id || ''}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 36px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 10, color: '#8892a4', fontSize: '0.88rem', fontFamily: 'monospace',
                          cursor: 'not-allowed',
                        }}
                      />
                      <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
                    </div>
                  </div>

                  {/* Email (Immutable) */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: '#6b7a8d', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Address <span style={{ color: '#00e5ff', fontSize: '0.7rem' }}>(Non-editable)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        disabled
                        value={user.email || ''}
                        style={{
                          width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 36px',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 10, color: '#8892a4', fontSize: '0.88rem',
                          cursor: 'not-allowed',
                        }}
                      />
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5568' }} />
                    </div>
                  </div>
                </div>

                {/* Editable Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })) }}
                      placeholder="Jane Doe"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.fullName ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = errors.fullName ? '#f43f5e' : 'rgba(255,255,255,0.1)'}
                    />
                    {errors.fullName && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 4 }}>{errors.fullName}</p>}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                      placeholder="+1 (555) 000-0000"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.phone ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = errors.phone ? '#f43f5e' : 'rgba(255,255,255,0.1)'}
                    />
                    {errors.phone && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 4 }}>{errors.phone}</p>}
                  </div>

                </div>

                {/* College / Company & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      College / Company Name
                    </label>
                    <input
                      type="text"
                      value={collegeCompany}
                      onChange={e => setCollegeCompany(e.target.value)}
                      placeholder="e.g. MIT, Stanford, Tesla Motors"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Mechanical Engineering, R&D"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                </div>

                {/* Designation & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={e => setDesignation(e.target.value)}
                      placeholder="e.g. Lead CAD Engineer, Student"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Boston, MA, USA"
                      style={{
                        width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                </div>

                {/* Bio / About */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Bio / About
                    </label>
                    <span style={{ fontSize: '0.72rem', color: bio.length > 450 ? '#f59e0b' : '#4a5568' }}>
                      {bio.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => { setBio(e.target.value); setErrors(p => ({ ...p, bio: '' })) }}
                    placeholder="Tell other engineers and verifiers about your work in 3D modeling and CAD design..."
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${errors.bio ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10, color: '#f0f4ff', fontSize: '0.88rem', outline: 'none', resize: 'vertical',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                    onBlur={e => e.target.style.borderColor = errors.bio ? '#f43f5e' : 'rgba(255,255,255,0.1)'}
                  />
                  {errors.bio && <p style={{ color: '#f43f5e', fontSize: '0.72rem', marginTop: 4 }}>{errors.bio}</p>}
                </div>

                {/* Submit button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                  <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <NeonButton variant="ghost">Cancel</NeonButton>
                  </Link>
                  <NeonButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={saving}
                    icon={Save}
                  >
                    Save Changes
                  </NeonButton>
                </div>

              </GlassCard>
            </div>

          </div>
        </form>

      </div>
    </div>
  )
}

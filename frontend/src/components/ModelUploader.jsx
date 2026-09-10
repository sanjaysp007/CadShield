import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileCheck, AlertCircle, X, File } from 'lucide-react'

const ACCEPTED = {
  'model/stl': ['.stl'],
  'model/obj': ['.obj'],
  'model/x-ply': ['.ply'],
  'model/off': ['.off'],
  'application/octet-stream': ['.stl', '.ply', '.off', '.obj'],
  'text/plain': ['.obj'],
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
}

function fmt(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1048576).toFixed(2)} MB`
}

const EXT_COLOR = {
  stl: '#00e5ff',
  obj: '#8b5cf6',
  ply: '#22c55e',
  off: '#f59e0b',
  pdf: '#ef4444',
  png: '#ec4899',
  jpg: '#3b82f6',
  jpeg: '#3b82f6',
  webp: '#14b8a6',
}

export default function ModelUploader({ onFileAccepted, loading = false }) {
  const [file,  setFile]  = useState(null)
  const [error, setError] = useState(null)

  const onDrop = useCallback(accepted => {
    setError(null)
    if (accepted[0]) {
      setFile(accepted[0])
      onFileAccepted?.(accepted[0])
    }
  }, [onFileAccepted])

  const onDropRejected = useCallback(rej => {
    setError(rej[0]?.errors[0]?.message || 'Invalid file type or size')
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, onDropRejected,
    accept: ACCEPTED, maxSize: 50 * 1024 * 1024,
    multiple: false, disabled: loading,
  })

  const ext   = file?.name?.split('.').pop()?.toLowerCase()
  const exCol = EXT_COLOR[ext] || '#00e5ff'

  const clear = e => { e.stopPropagation(); setFile(null); setError(null) }

  const borderColor = isDragReject ? '#f43f5e'
    : isDragActive ? '#00e5ff'
    : file ? '#22c55e'
    : 'rgba(255,255,255,0.1)'

  const bgColor = isDragReject ? 'rgba(244,63,94,0.04)'
    : isDragActive ? 'rgba(0,229,255,0.04)'
    : file ? 'rgba(34,197,94,0.03)'
    : 'rgba(255,255,255,0.015)'

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 20,
          padding: '48px 32px',
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: bgColor,
          transition: 'all 0.3s ease',
          position: 'relative', overflow: 'hidden',
          opacity: loading ? 0.6 : 1,
          boxShadow: isDragActive ? `0 0 40px rgba(0,229,255,0.12)` : 'none',
        }}
      >
        <input {...getInputProps()} />

        {/* Scan line on drag */}
        {isDragActive && <div className="scan-line-anim" style={{ position: 'absolute', inset: 0 }} />}

        <AnimatePresence mode="wait">
          {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
            >
              {/* File icon */}
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileCheck size={28} style={{ color: '#22c55e', filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.6))' }} />
              </div>
              <div>
                <p style={{ color: '#f0f4ff', fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>
                  {file.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99,
                    background: `${exCol}18`, border: `1px solid ${exCol}35`,
                    color: exCol, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                  }}>
                    .{ext?.toUpperCase()}
                  </span>
                  <span style={{ color: '#4a5568', fontSize: '0.82rem' }}>{fmt(file.size)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  color: '#4a5568', fontSize: '0.75rem', background: 'none',
                  border: 'none', cursor: 'pointer', marginTop: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = '#f43f5e'}
                onMouseLeave={e => e.target.style.color = '#4a5568'}
              >
                <X size={12} /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              {/* Upload icon */}
              <motion.div
                animate={isDragActive ? { scale: 1.15, y: -5 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  background: 'rgba(0,229,255,0.06)',
                  border: `1px solid ${isDragActive ? '#00e5ff' : 'rgba(0,229,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isDragActive ? '0 0 30px rgba(0,229,255,0.25)' : 'none',
                }}
              >
                <UploadCloud
                  size={28}
                  style={{ color: isDragActive ? '#00e5ff' : 'rgba(0,229,255,0.5)', filter: isDragActive ? 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' : 'none' }}
                />
              </motion.div>

              {isDragActive ? (
                <p style={{ color: '#00e5ff', fontWeight: 700, fontSize: '1.1rem', filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.6))' }}>
                  Drop it here!
                </p>
              ) : (
                <>
                  <div>
                    <p style={{ color: '#f0f4ff', fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>
                      Drag & drop your CAD model, PDF, or image
                    </p>
                    <p style={{ color: '#4a5568', fontSize: '0.85rem' }}>
                      or{' '}
                      <span style={{ color: '#00e5ff', textDecoration: 'underline', cursor: 'pointer' }}>
                        browse files
                      </span>
                    </p>
                  </div>
                  {/* Format badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Object.entries(EXT_COLOR).map(([ext, color]) => (
                      <span key={ext} style={{
                        padding: '3px 10px', borderRadius: 99,
                        background: `${color}10`, border: `1px solid ${color}25`,
                        color, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                      }}>
                        .{ext.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <p style={{ color: '#2d3748', fontSize: '0.75rem' }}>Maximum 50 MB</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#f43f5e', fontSize: '0.82rem' }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

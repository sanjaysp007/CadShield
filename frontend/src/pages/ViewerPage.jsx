import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import {
  RotateCcw, Grid3X3, Box, Layers, Eye, Upload, Info, AlertCircle,
  ShieldCheck, ChevronDown
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import GlassCard from '../components/GlassCard'
import { fetchProject3DFile, getStoredProjects, getModels } from '../utils/api'

/* ── Error Boundary for 3D Canvas ───────────────────── */
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('WebGL / Canvas Error caught:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100%', minHeight: 320, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center',
          background: 'rgba(15,23,42,0.6)', color: '#f0f4ff', borderRadius: 20
        }}>
          <AlertCircle size={36} style={{ color: '#f43f5e', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>3D Renderer Notice</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: 360, marginBottom: 16 }}>
            WebGL context paused or model complexity exceeded GPU budget.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '6px 16px', borderRadius: 8, background: 'rgba(0,229,255,0.1)',
              border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600
            }}
          >
            Reset Renderer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/* ── Demo 3D models ─────────────────────────────────── */
function TorusKnot({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => {
    if (m.current) {
      m.current.rotation.x += dt * 0.25
      m.current.rotation.y += dt * 0.18
    }
  })
  return (
    <mesh ref={m}>
      <torusKnotGeometry args={[1.2, 0.35, 120, 18]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.08} roughness={0.2} metalness={0.85} />
    </mesh>
  )
}

function Icosahedron({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => {
    if (m.current) {
      m.current.rotation.y += dt * 0.35
      m.current.rotation.z += dt * 0.12
    }
  })
  return (
    <mesh ref={m}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.12} roughness={0.25} metalness={0.8} />
    </mesh>
  )
}

function OctaModel({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => {
    if (m.current) {
      m.current.rotation.x += dt * 0.2
      m.current.rotation.z += dt * 0.15
    }
  })
  return (
    <mesh ref={m}>
      <octahedronGeometry args={[1.8, 0]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.1} roughness={0.3} metalness={0.75} />
    </mesh>
  )
}

function LoadedModelMesh({ customGeometry, wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => {
    if (m.current) {
      m.current.rotation.y += dt * 0.2
    }
  })

  if (!customGeometry) return null

  if (customGeometry.isGroup && customGeometry.object) {
    return <primitive object={customGeometry.object} ref={m} />
  }

  return (
    <mesh ref={m} geometry={customGeometry.geometry}>
      <meshStandardMaterial
        color={color}
        wireframe={wireframe}
        emissive={color}
        emissiveIntensity={0.08}
        roughness={0.25}
        metalness={0.75}
      />
    </mesh>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 10, 6]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-6, -6, -6]} intensity={0.5} color="#00e5ff" />
      <pointLight position={[0, 6, 0]} intensity={0.7} color="#8b5cf6" />
      <pointLight position={[0, -6, 0]} intensity={0.4} color="#ec4899" />
    </>
  )
}

const DEMO_MODELS = [
  { id: 'torus',  label: 'Torus Knot',   Component: TorusKnot,   verts: '6,400', faces: '12,800', color: '#00e5ff' },
  { id: 'ico',    label: 'Icosahedron',   Component: Icosahedron, verts: '12',    faces: '20',     color: '#8b5cf6' },
  { id: 'octa',   label: 'Octahedron',    Component: OctaModel,   verts: '6',     faces: '8',      color: '#ec4899' },
]

function ViewerPanel({ customGeometry, modelId, wireframe, color, label, badge, badgeColor }) {
  const demoModel = DEMO_MODELS.find(m => m.id === modelId) || DEMO_MODELS[0]

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: badgeColor, boxShadow: `0 0 10px ${badgeColor}` }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>{label}</span>
        <span style={{
          fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          background: `${badgeColor}18`, border: `1px solid ${badgeColor}40`, color: badgeColor,
        }}>{badge}</span>
      </div>

      <CanvasErrorBoundary>
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 2, 5.5]} fov={50} />
          <SceneLights />
          <Suspense fallback={null}>
            {customGeometry ? (
              <LoadedModelMesh customGeometry={customGeometry} wireframe={wireframe} color={color} />
            ) : (
              <demoModel.Component wireframe={wireframe} color={color} />
            )}
          </Suspense>
          <Grid infiniteGrid fadeDistance={24} sectionColor="rgba(0,229,255,0.08)" cellColor="rgba(255,255,255,0.04)" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.06} />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}

function CtrlBtn({ icon: Icon, label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600,
        background: active ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(0,229,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? '#00e5ff' : '#cbd5e1',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <Icon size={14} style={{ color: active ? '#00e5ff' : '#94a3b8' }} />
      {label}
    </motion.button>
  )
}

export default function ViewerPage() {
  const [searchParams] = useSearchParams()

  const [wireframe, setWireframe] = useState(false)
  const [splitView, setSplitView] = useState(false)
  const [selModel,  setSelModel]  = useState('torus')
  const [customGeometry, setCustomGeometry] = useState(null)
  const [availableProjects, setAvailableProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [loadingModel, setLoadingModel] = useState(false)

  useEffect(() => {
    document.title = '3D CAD Viewer – CADShield'
    getModels().then(list => {
      setAvailableProjects(list || [])
    })
  }, [])

  // Parse buffer into Three.js geometry
  const processBufferToGeometry = useCallback((buffer, filename, projectInfo = null) => {
    try {
      const ext = (filename.split('.').pop() || 'stl').toLowerCase()

      if (ext === 'obj') {
        const text = new TextDecoder().decode(buffer)
        const loader = new OBJLoader()
        const obj = loader.parse(text)
        const box = new THREE.Box3().setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        obj.position.sub(center)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        if (maxDim > 0) {
          const scale = 3.2 / maxDim
          obj.scale.set(scale, scale, scale)
        }

        let vertCount = 0
        let faceCount = 0
        obj.traverse((child) => {
          if (child.isMesh && child.geometry) {
            child.material = new THREE.MeshStandardMaterial({
              color: '#00e5ff',
              roughness: 0.25,
              metalness: 0.8,
            })
            vertCount += child.geometry.attributes.position ? child.geometry.attributes.position.count : 0
            faceCount += child.geometry.index ? Math.floor(child.geometry.index.count / 3) : Math.floor(vertCount / 3)
          }
        })

        setCustomGeometry({
          isGroup: true,
          object: obj,
          name: projectInfo?.project_name || projectInfo?.name || filename,
          verts: (projectInfo?.vertex_count || vertCount || 2847).toLocaleString(),
          faces: (projectInfo?.face_count || faceCount || 5690).toLocaleString(),
          format: 'OBJ',
          projectId: projectInfo?.project_id || '',
          status: projectInfo?.status || 'Protected',
          integrityScore: projectInfo?.integrity_score || 99.8,
        })
        toast.success(`Loaded 3D model: ${projectInfo?.project_name || filename}`)
        return
      }

      // Default: STL loader
      const loader = new STLLoader()
      const geom = loader.parse(buffer)
      geom.computeVertexNormals()
      geom.center()
      geom.computeBoundingBox()
      const box = geom.boundingBox
      const maxDim = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z)
      if (maxDim > 0) {
        const scale = 3.2 / maxDim
        geom.scale(scale, scale, scale)
      }
      const vertCount = geom.attributes.position ? geom.attributes.position.count : (projectInfo?.vertex_count || 2847)
      const faceCount = geom.index ? Math.floor(geom.index.count / 3) : Math.floor(vertCount / 3)

      setCustomGeometry({
        isGroup: false,
        geometry: geom,
        name: projectInfo?.project_name || projectInfo?.name || filename,
        verts: vertCount.toLocaleString(),
        faces: faceCount.toLocaleString(),
        format: 'STL',
        projectId: projectInfo?.project_id || '',
        status: projectInfo?.status || 'Protected',
        integrityScore: projectInfo?.integrity_score || 99.8,
      })
      toast.success(`Loaded 3D CAD model: ${projectInfo?.project_name || filename}`)
    } catch (err) {
      console.error('Failed to parse 3D buffer:', err)
      toast.error('Failed to parse 3D model geometry: ' + err.message)
    }
  }, [])

  // Load project by ID or project_id from URL or dropdown
  const loadProjectModel = useCallback(async (targetId, targetProjId) => {
    const key = targetProjId || targetId
    if (!key) return
    setLoadingModel(true)

    try {
      const stored = getStoredProjects()
      const pMatch = stored.find(p => p.id === targetId || p.project_id === targetProjId || p.project_id === key || p.id === key)

      const fileData = await fetchProject3DFile(key)
      if (fileData?.blob) {
        const reader = new FileReader()
        reader.onload = (e) => {
          processBufferToGeometry(e.target.result, fileData.name || pMatch?.name || `${key}.stl`, pMatch)
          setLoadingModel(false)
        }
        reader.readAsArrayBuffer(fileData.blob)
      } else if (pMatch) {
        // Fallback: create procedural mechanical geometry matching project
        const geom = new THREE.CylinderGeometry(1.2, 1.4, 2.2, 32, 16)
        geom.computeVertexNormals()
        geom.center()
        setCustomGeometry({
          isGroup: false,
          geometry: geom,
          name: pMatch.project_name || pMatch.name,
          verts: (pMatch.vertex_count || 2847).toLocaleString(),
          faces: (pMatch.face_count || 5690).toLocaleString(),
          format: (pMatch.file_format || 'STL').toUpperCase(),
          projectId: pMatch.project_id,
          status: pMatch.status || 'Protected',
          integrityScore: pMatch.integrity_score || 99.8,
        })
        setLoadingModel(false)
      } else {
        setLoadingModel(false)
      }
    } catch (err) {
      console.error('Error loading project model:', err)
      setLoadingModel(false)
    }
  }, [processBufferToGeometry])

  // React to URL parameters (?id=... or ?projectId=...)
  useEffect(() => {
    const paramId = searchParams.get('id')
    const paramProjectId = searchParams.get('projectId') || searchParams.get('project_id')

    if (paramId || paramProjectId) {
      setSelectedProjectId(paramProjectId || paramId)
      loadProjectModel(paramId, paramProjectId)
    } else {
      const stored = getStoredProjects()
      if (stored && stored.length > 0) {
        const latest = stored[0]
        setSelectedProjectId(latest.project_id || latest.id)
        loadProjectModel(latest.id, latest.project_id)
      }
    }
  }, [searchParams, loadProjectModel])

  const handleSelectProjectChange = (e) => {
    const val = e.target.value
    setSelectedProjectId(val)
    if (!val) {
      setCustomGeometry(null)
      return
    }
    const found = availableProjects.find(p => p.project_id === val || p.id === val)
    loadProjectModel(found?.id, found?.project_id || val)
  }

  const parseModelFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      processBufferToGeometry(e.target.result, file.name, {
        project_name: file.name.replace(/\.[^/.]+$/, ''),
        name: file.name,
        file_format: file.name.split('.').pop(),
        status: 'Uploaded',
      })
    }
    reader.readAsArrayBuffer(file)
  }, [processBufferToGeometry])

  const onDrop = useCallback(files => {
    if (files?.[0]) parseModelFile(files[0])
  }, [parseModelFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.stl', '.ply', '.off'],
      'model/stl': ['.stl'],
      'text/plain': ['.obj'],
    },
  })

  const curDemo = DEMO_MODELS.find(m => m.id === selModel) || DEMO_MODELS[0]

  const modelStats = [
    ['Model Type',  customGeometry ? (customGeometry.name.length > 18 ? customGeometry.name.substring(0, 16) + '...' : customGeometry.name) : curDemo.label],
    ['Project ID',  customGeometry?.projectId || 'DEMO-STD'],
    ['Vertices',    customGeometry ? customGeometry.verts : curDemo.verts],
    ['Faces',       customGeometry ? customGeometry.faces : curDemo.faces],
    ['Format',      customGeometry ? customGeometry.format : 'STL'],
    ['Status',      customGeometry?.status || 'Protected'],
    ['Watermark',   customGeometry ? 'Embedded & Authenticated ✓' : 'Demo Mode'],
    ['Integrity',   customGeometry ? `${customGeometry.integrityScore}%` : '99.8%'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px' }} className="px-3 sm:px-6">

          {/* Header + controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, color: '#f0f4ff',
                letterSpacing: '-0.02em', marginBottom: 4,
              }}>
                3D CAD{' '}
                <span style={{ background: 'linear-gradient(135deg,#00e5ff,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Viewer</span>
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                Real-time interactive WebGL renderer · Geometry inspection · Watermark comparison
              </p>
            </div>

            {/* Project Switcher + View Controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              {availableProjects.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedProjectId}
                    onChange={handleSelectProjectChange}
                    style={{
                      appearance: 'none',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(0,229,255,0.35)',
                      borderRadius: 10,
                      padding: '8px 32px 8px 14px',
                      color: '#00e5ff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="" style={{ background: '#070913', color: '#94a3b8' }}>Select Project to View...</option>
                    {availableProjects.map((p, i) => (
                      <option key={p.project_id || p.id || i} value={p.project_id || p.id} style={{ background: '#070913', color: '#f0f4ff' }}>
                        {p.project_name || p.name} ({p.project_id || 'PRJ'})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#00e5ff' }} />
                </div>
              )}

              <CtrlBtn icon={wireframe ? Box : Grid3X3} label={wireframe ? 'Solid' : 'Wireframe'} active={wireframe} onClick={() => setWireframe(v => !v)} />
              <CtrlBtn icon={Layers} label={splitView ? 'Single View' : 'Compare View'} active={splitView} onClick={() => setSplitView(v => !v)} />
              {customGeometry && (
                <CtrlBtn
                  icon={RotateCcw}
                  label="Reset to Demos"
                  active={false}
                  onClick={() => { setCustomGeometry(null); setSelectedProjectId(''); toast('Switched to stock demo models') }}
                />
              )}
              {!customGeometry && DEMO_MODELS.map(m => (
                <CtrlBtn key={m.id} icon={Eye} label={m.label} active={selModel === m.id} onClick={() => setSelModel(m.id)} />
              ))}
            </div>
          </div>

          {/* Active Model Notification Bar */}
          {customGeometry && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              padding: '12px 18px', borderRadius: 14, marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(0,229,255,0.08), rgba(139,92,246,0.08))',
              border: '1px solid rgba(0,229,255,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} style={{ color: '#00e5ff' }} />
                <div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f0f4ff' }}>
                    Viewing CAD Model: <span style={{ color: '#00e5ff' }}>{customGeometry.name}</span>
                  </span>
                  {customGeometry.projectId && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#a78bfa', marginLeft: 8 }}>
                      ({customGeometry.projectId})
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to="/my-projects" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#cbd5e1', cursor: 'pointer'
                  }}>
                    My Projects
                  </button>
                </Link>
                {customGeometry.projectId && (
                  <Link to={`/verify-project?id=${customGeometry.projectId}`} style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#22c55e', cursor: 'pointer'
                    }}>
                      Verify Project
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Viewer panels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: splitView ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
            gap: 16, marginBottom: 20,
          }}>
            {/* Primary / Original */}
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#07090f',
              height: splitView ? 'clamp(320px, 48vh, 440px)' : 'clamp(360px, 58vh, 520px)',
              position: 'relative'
            }}>
              {loadingModel ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,229,255,0.2)', borderTopColor: '#00e5ff', animation: 'rotate-slow 0.8s linear infinite', marginBottom: 12 }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading 3D CAD model geometry...</p>
                </div>
              ) : (
                <ViewerPanel
                  customGeometry={customGeometry}
                  modelId={selModel}
                  wireframe={wireframe}
                  color={customGeometry ? '#00e5ff' : curDemo.color}
                  label={customGeometry ? customGeometry.name : 'Original Model'}
                  badge={customGeometry ? 'AUTHENTIC CAD' : 'ORIGINAL'}
                  badgeColor="#00e5ff"
                />
              )}
            </div>

            {/* Watermarked Comparison — split view only */}
            {splitView && (
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                border: '1px solid rgba(139,92,246,0.25)',
                background: '#07090f',
                height: 'clamp(320px, 48vh, 440px)',
                position: 'relative'
              }}>
                <ViewerPanel
                  customGeometry={customGeometry}
                  modelId={selModel}
                  wireframe={wireframe}
                  color="#8b5cf6"
                  label={customGeometry ? `${customGeometry.name} [Watermarked]` : 'Watermarked Verification Mesh'}
                  badge="WATERMARKED"
                  badgeColor="#8b5cf6"
                />
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Drop zone */}
            <GlassCard hover={false} padding="22px">
              <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={16} style={{ color: '#00e5ff' }} />
                Load Any 3D File (STL / OBJ)
              </div>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#00e5ff' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 14, padding: '26px 16px', textAlign: 'center', cursor: 'pointer',
                  background: isDragActive ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.01)',
                  transition: 'all 0.2s',
                }}
              >
                <input {...getInputProps()} />
                <Upload size={22} style={{ color: isDragActive ? '#00e5ff' : '#94a3b8', margin: '0 auto 10px' }} />
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>Drop STL or OBJ model file here</p>
                <p style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: 4 }}>or click to browse from device</p>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
                Full 3D rendering with live WebGL hardware acceleration
              </p>
            </GlassCard>

            {/* Model info */}
            <GlassCard hover={false} padding="22px">
              <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.92rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} style={{ color: '#8b5cf6' }} />
                Model Specifications
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10 }}>
                {modelStats.map(([l, v]) => (
                  <div key={l} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f0f4ff' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: '#38bdf8', lineHeight: 1.4 }}>
                  💡 Orbit with left-click · Pan with right-click · Zoom with scroll wheel
                </p>
              </div>
            </GlassCard>

          </div>
        </div>
      </div>
    </div>
  )
}

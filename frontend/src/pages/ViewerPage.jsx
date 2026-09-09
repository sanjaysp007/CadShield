import { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import { motion } from 'framer-motion'
import { RotateCcw, Grid3X3, Box, Layers, Eye, Upload, Info, Maximize2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import GlassCard from '../components/GlassCard'

/* ── Demo 3D models ─────────────────────────────────── */
function TorusKnot({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => { m.current.rotation.x += dt * 0.25; m.current.rotation.y += dt * 0.18 })
  return (
    <mesh ref={m}>
      <torusKnotGeometry args={[1.2, 0.35, 120, 18]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.08} roughness={0.2} metalness={0.85} />
    </mesh>
  )
}

function Icosahedron({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => { m.current.rotation.y += dt * 0.35; m.current.rotation.z += dt * 0.12 })
  return (
    <mesh ref={m}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.12} roughness={0.25} metalness={0.8} />
    </mesh>
  )
}

function OctaModel({ wireframe, color }) {
  const m = useRef()
  useFrame((_, dt) => { m.current.rotation.x += dt * 0.2; m.current.rotation.z += dt * 0.15 })
  return (
    <mesh ref={m}>
      <octahedronGeometry args={[1.8, 0]} />
      <meshStandardMaterial color={color} wireframe={wireframe} emissive={color} emissiveIntensity={0.1} roughness={0.3} metalness={0.75} />
    </mesh>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 10, 6]} intensity={1.5} color="#ffffff" castShadow />
      <directionalLight position={[-6, -6, -6]} intensity={0.4} color="#00e5ff" />
      <pointLight position={[0, 6, 0]} intensity={0.6} color="#8b5cf6" />
      <pointLight position={[0, -6, 0]} intensity={0.3} color="#ec4899" />
    </>
  )
}

const MODELS = [
  { id: 'torus',  label: 'Torus Knot',   Component: TorusKnot,   verts: '6 400', faces: '12 800', color: '#00e5ff' },
  { id: 'ico',    label: 'Icosahedron',   Component: Icosahedron, verts: '12',    faces: '20',     color: '#8b5cf6' },
  { id: 'octa',   label: 'Octahedron',    Component: OctaModel,   verts: '6',     faces: '8',      color: '#ec4899' },
]

function ViewerPanel({ model, wireframe, color, label, badge, badgeColor }) {
  const { Component } = MODELS.find(m => m.id === model) || MODELS[0]
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: badgeColor, boxShadow: `0 0 8px ${badgeColor}` }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8892a4' }}>{label}</span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          background: `${badgeColor}15`, border: `1px solid ${badgeColor}30`, color: badgeColor,
        }}>{badge}</span>
      </div>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 2, 5.5]} fov={50} />
        <SceneLights />
        <Suspense fallback={null}>
          <Component wireframe={wireframe} color={color} />
        </Suspense>
        <Grid infiniteGrid fadeDistance={20} sectionColor="rgba(0,229,255,0.06)" cellColor="rgba(255,255,255,0.03)" />
        <OrbitControls makeDefault enableDamping dampingFactor={0.06} />
      </Canvas>
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
        background: active ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
        color: active ? '#00e5ff' : '#6b7a8d',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <Icon size={13} />
      {label}
    </motion.button>
  )
}

export default function ViewerPage() {
  const [wireframe, setWireframe] = useState(false)
  const [splitView, setSplitView] = useState(false)
  const [selModel,  setSelModel]  = useState('torus')

  useEffect(() => { document.title = '3D Viewer – CADShield' }, [])

  const onDrop = useCallback(files => {
    const n = files[0]?.name?.toLowerCase()
    if (n?.includes('gear') || n?.includes('ico')) setSelModel('ico')
    else if (n?.includes('octa')) setSelModel('octa')
    else setSelModel('torus')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/octet-stream': ['.stl','.ply','.off'], 'text/plain': ['.obj'] },
  })

  const curModel = MODELS.find(m => m.id === selModel) || MODELS[0]

  const modelStats = [
    ['Model Type',  curModel.label],
    ['Vertices',    curModel.verts],
    ['Faces',       curModel.faces],
    ['Watertight',  'Yes ✓'],
    ['Watermark',   'Embedded ✓'],
    ['Integrity',   '99.8%'],
    ['Format',      'STL (demo)'],
    ['Status',      'Protected'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header + controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: '2rem', fontWeight: 800, color: '#f0f4ff',
                letterSpacing: '-0.02em', marginBottom: 4,
              }}>
                3D Model{' '}
                <span style={{ background: 'linear-gradient(135deg,#00e5ff,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Viewer</span>
              </h1>
              <p style={{ color: '#4a5568', fontSize: '0.85rem' }}>Interactive WebGL viewer · Orbit · Pan · Zoom</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <CtrlBtn icon={wireframe ? Box : Grid3X3} label={wireframe ? 'Solid' : 'Wireframe'} active={wireframe} onClick={() => setWireframe(v=>!v)} />
              <CtrlBtn icon={Layers}   label={splitView ? 'Single View' : 'Compare View'} active={splitView}  onClick={() => setSplitView(v=>!v)} />
              {MODELS.map(m => (
                <CtrlBtn key={m.id} icon={Eye} label={m.label} active={selModel===m.id} onClick={() => setSelModel(m.id)} />
              ))}
            </div>
          </div>

          {/* Viewer panels */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: splitView ? '1fr 1fr' : '1fr',
            gap: 14, marginBottom: 16,
          }}>
            {/* Original */}
            <div style={{
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              background: '#07090f',
              height: splitView ? 440 : 520,
            }}>
              <ViewerPanel
                model={selModel} wireframe={wireframe}
                color={curModel.color}
                label="Original Model" badge="ORIGINAL" badgeColor="#00e5ff"
              />
            </div>

            {/* Watermarked — split only */}
            {splitView && (
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                border: '1px solid rgba(139,92,246,0.15)',
                background: '#07090f',
                height: 440,
              }}>
                <ViewerPanel
                  model={selModel} wireframe={wireframe}
                  color="#8b5cf6"
                  label="Watermarked Model" badge="WATERMARKED" badgeColor="#8b5cf6"
                />
              </div>
            )}
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }} className="grid grid-cols-1 lg:grid-cols-3">

            {/* Drop zone */}
            <GlassCard hover={false} padding="20px">
              <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={14} style={{ color: '#00e5ff' }} />
                Load Your Model
              </div>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#00e5ff' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                  background: isDragActive ? 'rgba(0,229,255,0.03)' : 'transparent',
                  transition: 'all 0.3s',
                }}
              >
                <input {...getInputProps()} />
                <Upload size={20} style={{ color: isDragActive ? '#00e5ff' : '#2d3748', margin: '0 auto 10px' }} />
                <p style={{ color: '#4a5568', fontSize: '0.78rem' }}>Drop STL/OBJ/PLY here</p>
                <p style={{ color: '#2d3748', fontSize: '0.72rem', marginTop: 4 }}>to preview in viewer</p>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#1f2937', marginTop: 10, textAlign: 'center' }}>
                Note: Full mesh loading is backend-dependent
              </p>
            </GlassCard>

            {/* Model info */}
            <GlassCard hover={false} padding="20px" style={{ gridColumn: 'span 2' }}>
              <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={14} style={{ color: '#8b5cf6' }} />
                Model Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {modelStats.map(([l, v]) => (
                  <div key={l} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.68rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#8892a4' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(0,229,255,0.6)' }}>
                  💡 Rotate with left-click · Pan with right-click · Zoom with scroll wheel · Press R to reset view
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}

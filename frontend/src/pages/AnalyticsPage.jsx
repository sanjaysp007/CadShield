import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale,
  Tooltip, Legend, Filler
} from 'chart.js'
import { Radar, Line, Bar, Doughnut } from 'react-chartjs-2'
import { Activity, Cpu, Shield, Printer, Layers, Fingerprint, TrendingUp } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import { getAnalytics, getModels } from '../utils/api'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Tooltip, Legend, Filler
)

const TOOLTIP = {
  backgroundColor: 'rgba(7,10,23,0.98)',
  borderColor: 'rgba(0,229,255,0.2)', borderWidth: 1,
  titleColor: '#00e5ff', bodyColor: '#8892a4',
  padding: 12, cornerRadius: 10,
  titleFont: { family: 'Space Grotesk', weight: 700 },
  bodyFont: { family: 'Inter', size: 12 },
}
const GRID  = { color: 'rgba(255,255,255,0.04)' }
const TICKS = { color: '#4a5568', font: { size: 10, family: 'Inter' } }

/* ── Mini metric card ───────────────────────────────── */
function MiniMetric({ label, value, suffix = '', color = '#00e5ff', icon: Icon }) {
  return (
    <div style={{
      padding: '16px 18px', borderRadius: 16,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `${color}12`, border: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}{suffix}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data,    setData]   = useState(null)
  const [models,  setModels] = useState([])
  const [selId,   setSelId]  = useState('')
  const [loading, setLoad]   = useState(true)

  useEffect(() => { document.title = 'Analytics – CADShield' }, [])

  useEffect(() => {
    const load = async () => {
      const [ms, ad] = await Promise.all([getModels(), getAnalytics(null)])
      setModels(ms); setData(ad); setLoad(false)
    }
    load()
  }, [])

  const onModelChange = async (id) => {
    setSelId(id)
    const ad = await getAnalytics(id)
    setData(ad)
  }

  const radarData = data ? {
    labels: ['WM Strength', 'Robustness', 'Integrity', 'Confidence', 'Printability', 'Auth Score'],
    datasets: [{
      label: 'Security Profile',
      data: [
        Math.min(100, data.watermark_robustness),
        data.watermark_robustness,
        data.integrity_score,
        data.authentication_confidence,
        data.printability_score,
        data.authentication_confidence * 0.97,
      ],
      backgroundColor: 'rgba(0,229,255,0.07)',
      borderColor: '#00e5ff', borderWidth: 2,
      pointBackgroundColor: '#00e5ff', pointBorderColor: '#04060f', pointBorderWidth: 2,
      pointRadius: 4,
    }],
  } : null

  const vertData = data ? {
    labels: Array.from({ length: 10 }, (_, i) => `B${i+1}`),
    datasets: [{
      label: 'Vertex Distribution',
      data: data.vertex_distribution,
      borderColor: '#00e5ff',
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0,0,0,160)
        g.addColorStop(0,'rgba(0,229,255,0.2)')
        g.addColorStop(1,'rgba(0,229,255,0)')
        return g
      },
      tension: 0.45, fill: true, pointRadius: 3,
      pointBackgroundColor: '#00e5ff', pointBorderColor: '#04060f', pointBorderWidth: 2,
    }],
  } : null

  const faceData = data ? {
    labels: Array.from({ length: 10 }, (_, i) => `B${i+1}`),
    datasets: [{
      label: 'Face Area Dist.',
      data: data.face_area_distribution,
      backgroundColor: 'rgba(139,92,246,0.45)',
      borderColor: '#8b5cf6', borderWidth: 1,
      borderRadius: 6, borderSkipped: false,
    }],
  } : null

  const confData = data ? {
    labels: ['Confidence', 'Gap'],
    datasets: [{
      data: [data.authentication_confidence, 100 - data.authentication_confidence],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(255,255,255,0.04)'],
      borderColor: ['#22c55e', 'rgba(255,255,255,0.06)'],
      borderWidth: 1, hoverOffset: 4,
    }],
  } : null

  const baseOpts = (extra = {}) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { tooltip: TOOLTIP, legend: { labels: { color: '#6b7a8d', font: { family: 'Inter', size: 11 }, boxWidth: 10 } }, ...extra },
  })

  const scales = { x: { grid: GRID, ticks: TICKS }, y: { grid: GRID, ticks: TICKS } }

  return (
    <div style={{ minHeight: '100vh', background: '#04060f', position: 'relative' }}>
      <div className="aurora" />
      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: '2rem', fontWeight: 800, color: '#f0f4ff',
                letterSpacing: '-0.02em', marginBottom: 6,
              }}>
                Security{' '}
                <span style={{ background: 'linear-gradient(135deg,#00e5ff,#8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                  Analytics
                </span>
              </h1>
              <p style={{ color: '#4a5568', fontSize: '0.9rem' }}>Watermark robustness, geometry metrics, and authentication confidence.</p>
            </div>
            <select
              value={selId}
              onChange={e => onModelChange(e.target.value)}
              className="input-field"
              style={{ width: 'auto', minWidth: 200 }}
            >
              <option value="">Demo / Default Model</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Top metrics strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <MiniMetric label="Geo Distortion"  value={(data?.geometry_distortion ?? 0.08).toFixed(3)} suffix="%" icon={Layers}      color="#f59e0b" />
            <MiniMetric label="Vertex Changes"  value={data?.vertex_change_count ?? 384}              icon={Cpu}         color="#00e5ff" />
            <MiniMetric label="Face Changes"    value={data?.face_change_count ?? 0}                   icon={Layers}      color="#8b5cf6" />
            <MiniMetric label="WM Robustness"   value={(data?.watermark_robustness ?? 94.2).toFixed(1)} suffix="%" icon={Fingerprint} color="#8b5cf6" />
            <MiniMetric label="Integrity"       value={(data?.integrity_score ?? 99.8).toFixed(1)}    suffix="%" icon={Shield}       color="#22c55e" />
            <MiniMetric label="Printability"    value={(data?.printability_score ?? 97.8).toFixed(1)} suffix="%" icon={Printer}      color="#00e5ff" />
          </div>

          {/* Charts row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }} className="grid grid-cols-1 lg:grid-cols-5">
            <GlassCard hover={false} padding="24px" style={{ gridColumn: 'span 3' }}>
              <div style={{ fontWeight: 700, color: '#f0f4ff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} style={{ color: '#00e5ff' }} />
                Security Radar Profile
              </div>
              <p style={{ color: '#374151', fontSize: '0.75rem', marginBottom: 20 }}>6-axis watermark performance overview</p>
              <div style={{ height: 280 }}>
                {radarData && (
                  <Radar data={radarData} options={{
                    ...baseOpts({ legend: { display: false } }),
                    scales: {
                      r: {
                        min: 0, max: 100,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#374151', stepSize: 20, backdropColor: 'transparent', font: { size: 9 } },
                        pointLabels: { color: '#8892a4', font: { size: 11, family: 'Inter' } },
                      }
                    },
                  }} />
                )}
              </div>
            </GlassCard>

            <GlassCard hover={false} padding="24px" style={{ gridColumn: 'span 2' }}>
              <div style={{ fontWeight: 700, color: '#f0f4ff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} style={{ color: '#22c55e' }} />
                Auth Confidence
              </div>
              <p style={{ color: '#374151', fontSize: '0.75rem', marginBottom: 20 }}>Watermark recognition certainty</p>
              <div style={{ height: 240 }}>
                {confData && (
                  <Doughnut data={confData} options={{
                    ...baseOpts({ legend: { position: 'bottom', labels: { color: '#6b7a8d', font: { family: 'Inter', size: 11 }, padding: 16 } } }),
                    cutout: '70%', scales: {},
                  }} />
                )}
              </div>
              {data && (
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>
                    {data.authentication_confidence?.toFixed(1)}%
                  </span>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Charts row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }} className="grid grid-cols-1 lg:grid-cols-2">
            <GlassCard hover={false} padding="24px">
              <div style={{ fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>Vertex Distance Distribution</div>
              <div style={{ height: 190 }}>
                {vertData && <Line data={vertData} options={{ ...baseOpts({ legend: { display: false } }), scales }} />}
              </div>
            </GlassCard>
            <GlassCard hover={false} padding="24px">
              <div style={{ fontWeight: 700, color: '#f0f4ff', marginBottom: 16 }}>Face Area Distribution</div>
              <div style={{ height: 190 }}>
                {faceData && <Bar data={faceData} options={{ ...baseOpts({ legend: { display: false } }), scales }} />}
              </div>
            </GlassCard>
          </div>

          {/* Metrics table */}
          <GlassCard hover={false} padding="0" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 700, color: '#f0f4ff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} style={{ color: '#00e5ff' }} />
              Detailed Metrics Comparison
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr><th>Metric</th><th>Original</th><th>Watermarked</th><th>Δ Change</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {[
                    { m: 'Vertex Count',        o: data?.vertex_count,        w: data?.vertex_count,                       d: '0',                                                   },
                    { m: 'Face Count',           o: data?.face_count,          w: data?.face_count,                         d: '0',                                                   },
                    { m: 'Integrity Score',      o: '100.00%',                 w: `${data?.integrity_score?.toFixed(2)}%`,  d: `-${(100-(data?.integrity_score||100)).toFixed(2)}%`,   },
                    { m: 'Geometry Distortion',  o: '0.000%',                  w: `${data?.geometry_distortion?.toFixed(4)}%`, d: `+${data?.geometry_distortion?.toFixed(4)}%`,       },
                    { m: 'WM Robustness',        o: '—',                       w: `${data?.watermark_robustness?.toFixed(1)}%`, d: 'N/A',                                            },
                    { m: 'Printability Score',   o: '100.0%',                  w: `${data?.printability_score?.toFixed(1)}%`, d: `-${(100-(data?.printability_score||100)).toFixed(1)}%`, },
                    { m: 'Auth Confidence',      o: '—',                       w: `${data?.authentication_confidence?.toFixed(1)}%`, d: 'N/A',                                     },
                  ].map(row => (
                    <tr key={row.m}>
                      <td style={{ color: '#f0f4ff', fontWeight: 500 }}>{row.m}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{row.o?.toLocaleString?.() ?? row.o}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#00e5ff' }}>{row.w?.toLocaleString?.() ?? row.w}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#f59e0b' }}>{row.d}</td>
                      <td><span className="badge badge-green">Normal</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

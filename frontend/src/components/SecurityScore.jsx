import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function scoreColor(s) {
  if (s >= 90) return { stroke: '#22c55e', glow: 'rgba(34,197,94,0.5)',  text: '#22c55e', label: 'VERIFIED',  bg: 'rgba(34,197,94,0.06)'  }
  if (s >= 70) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.5)', text: '#f59e0b', label: 'MODIFIED',  bg: 'rgba(245,158,11,0.06)' }
  return          { stroke: '#f43f5e', glow: 'rgba(244,63,94,0.5)',  text: '#f43f5e', label: 'TAMPERED', bg: 'rgba(244,63,94,0.06)'  }
}

export default function SecurityScore({
  score = 0, size = 200,
  label = null, showLabel = true, animated = true,
}) {
  const circleRef = useRef(null)
  const radius       = (size / 2) * 0.72
  const strokeWidth  = size * 0.055
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2
  const { stroke, glow, text, label: statusLabel, bg } = scoreColor(score)

  useEffect(() => {
    if (!circleRef.current) return
    const delay = animated ? 400 : 0
    const timeout = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(
          circumference - (score / 100) * circumference
        )
      }
    }, delay)
    return () => clearTimeout(timeout)
  }, [score, circumference, animated])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Outer glow ring */}
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: size * 0.05,
            borderRadius: '50%',
            border: `1px solid ${stroke}`,
            boxShadow: `0 0 24px ${glow}`,
            pointerEvents: 'none',
          }}
        />

        <svg
          width={size} height={size}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {/* Glow track (thick, blurred) */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (score / 100) * circumference}
            strokeLinecap="round"
            opacity={0.12}
            style={{ filter: `blur(${size * 0.02}px)` }}
          />
          {/* Main arc */}
          <circle
            ref={circleRef}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{
              transition: animated ? 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)' : 'none',
              filter: `drop-shadow(0 0 ${size * 0.04}px ${glow})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          <motion.div
            initial={animated ? { opacity: 0, scale: 0.6 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.34,1.56,0.64,1] }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: size * 0.2,
              fontWeight: 800,
              color: text,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              filter: `drop-shadow(0 0 ${size * 0.04}px ${glow})`,
            }}
          >
            {Math.round(score)}%
          </motion.div>
          <div style={{
            fontSize: size * 0.065,
            color: 'rgba(107,122,141,0.7)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            INTEGRITY
          </div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={animated ? { opacity: 0, y: 8 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            padding: '5px 18px', borderRadius: 99,
            background: bg,
            border: `1px solid ${stroke}35`,
            color: text,
            fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          {label || statusLabel}
        </motion.div>
      )}
    </div>
  )
}

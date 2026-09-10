import { motion, AnimatePresence } from 'framer-motion'
import { Check, Upload, Shield, CheckCircle, Cpu, Fingerprint } from 'lucide-react'

const DEFAULT_STEPS = [
  { label: 'Upload Model',     icon: Upload },
  { label: 'Ownership Info',   icon: Fingerprint },
  { label: 'Embed Watermark',  icon: Cpu },
  { label: 'Result',           icon: CheckCircle },
]

export default function StepProgress({ currentStep = 1, steps = DEFAULT_STEPS }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, width: '100%' }}>
      {steps.map((step, idx) => {
        const num     = idx + 1
        const isDone  = currentStep > num
        const isCur   = currentStep === num
        const Icon    = step.icon || (isDone ? Check : CheckCircle)

        const circleColor  = isDone ? '#22c55e' : isCur ? '#00e5ff' : 'rgba(255,255,255,0.2)'
        const circleBorder = isDone ? '#22c55e' : isCur ? '#00e5ff' : 'rgba(255,255,255,0.2)'
        const circleBg     = isDone ? 'rgba(34,197,94,0.15)' : isCur ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)'
        const labelColor   = isDone ? '#22c55e' : isCur ? '#00e5ff' : '#94a3b8'

        return (
          <div key={num} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : undefined }}>
            {/* Circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 60 }}>
              <motion.div
                animate={isCur ? {
                  boxShadow: ['0 0 0 0 rgba(0,229,255,0)', '0 0 0 6px rgba(0,229,255,0.15)', '0 0 0 0 rgba(0,229,255,0)']
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: 40, height: 40, borderRadius: 14,
                  background: circleBg,
                  border: `1.5px solid ${circleBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.4s ease',
                }}
              >
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                      <Check size={16} style={{ color: '#22c55e' }} />
                    </motion.div>
                  ) : (
                    <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Icon size={15} style={{ color: circleColor }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: labelColor, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, margin: '0 8px', marginBottom: 24, overflow: 'hidden' }}>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isDone ? 1 : isCur ? 0.4 : 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: isDone
                      ? 'linear-gradient(90deg, #22c55e, #00e5ff)'
                      : 'linear-gradient(90deg, #00e5ff, #8b5cf6)',
                    transformOrigin: 'left',
                    borderRadius: 99,
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

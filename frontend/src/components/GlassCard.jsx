import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export default function GlassCard({
  children, className = '', style = {},
  hover = true, glow = false, padding = '24px', ...props
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, scale: 1.008 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(glow ? 'glass-glow' : '', className)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        padding,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {/* Inner shine */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
        borderRadius: 'inherit', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </motion.div>
  )
}

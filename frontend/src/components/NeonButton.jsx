import { motion } from 'framer-motion'

const VARIANTS = {
  primary: {
    background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
    color: '#04060f',
    border: 'none',
    hoverShadow: '0 0 32px rgba(0,229,255,0.4)',
  },
  secondary: {
    background: 'rgba(0,229,255,0.08)',
    color: '#00e5ff',
    border: '1px solid rgba(0,229,255,0.25)',
    hoverShadow: '0 0 20px rgba(0,229,255,0.2)',
  },
  ghost: {
    background: 'rgba(255,255,255,0.04)',
    color: '#8892a4',
    border: '1px solid rgba(255,255,255,0.08)',
    hoverShadow: 'none',
  },
  danger: {
    background: 'rgba(244,63,94,0.12)',
    color: '#f43f5e',
    border: '1px solid rgba(244,63,94,0.25)',
    hoverShadow: '0 0 20px rgba(244,63,94,0.3)',
  },
}

const SIZES = {
  sm:  { padding: '7px 14px',  fontSize: '0.78rem', borderRadius: 10, gap: 5 },
  md:  { padding: '10px 20px', fontSize: '0.85rem', borderRadius: 12, gap: 7 },
  lg:  { padding: '13px 28px', fontSize: '0.92rem', borderRadius: 14, gap: 8 },
  xl:  { padding: '16px 36px', fontSize: '1rem',    borderRadius: 16, gap: 9 },
}

export default function NeonButton({
  children, variant = 'primary', size = 'md',
  icon: Icon, loading = false, disabled = false,
  onClick, type = 'button', style = {}, fullWidth = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary
  const s = SIZES[size] || SIZES.md

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !loading ? { scale: 1.04, boxShadow: v.hoverShadow } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      onClick={!disabled && !loading ? onClick : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize, fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        borderRadius: s.borderRadius,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: v.border,
        background: v.background,
        color: v.color,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.4 : 1,
        width: fullWidth ? '100%' : 'auto',
        letterSpacing: '-0.01em',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 14, height: 14,
            border: `2px solid ${v.color}40`,
            borderTop: `2px solid ${v.color}`,
            borderRadius: '50%',
          }}
        />
      ) : Icon && (
        <Icon size={parseInt(s.fontSize) * 14 || 14} />
      )}
      {children}
    </motion.button>
  )
}

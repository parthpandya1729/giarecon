import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LiveCounterProps {
  value: number
  duration?: number // Animation duration in ms
  format?: 'number' | 'percentage' | 'currency'
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export default function LiveCounter({
  value,
  duration = 1000,
  format = 'number',
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: LiveCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function for smooth animation (easeOutCubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentCount = easeOutCubic * value

      setCount(currentCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(decimals)}%`
      case 'currency':
        return `$${val.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`
      default:
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`
        } else if (val >= 1000) {
          return `${(val / 1000).toFixed(1)}K`
        }
        return val.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
    }
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {prefix}
      {formatValue(count)}
      {suffix}
    </motion.span>
  )
}

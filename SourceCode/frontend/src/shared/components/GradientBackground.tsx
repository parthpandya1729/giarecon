import { cn } from '@/shared/utils/cn'

interface GradientBackgroundProps {
  className?: string
}

export default function GradientBackground({ className }: GradientBackgroundProps) {
  return (
    <div className={cn('fixed inset-0 -z-10 bg-gray-50', className)}>
      {/* Subtle professional gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-benow-blue-50 opacity-60" />
    </div>
  )
}

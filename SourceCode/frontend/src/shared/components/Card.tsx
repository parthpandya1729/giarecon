import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  interactive?: boolean
  noPadding?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', interactive = false, noPadding = false, children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-gray-200 shadow-card',
      outlined: 'bg-white border-2 border-gray-300',
      elevated: 'bg-white shadow-card-elevated',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg',
          variantClasses[variant],
          interactive && 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer',
          !noPadding && 'p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card

import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface Step {
  id: number
  name: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick: (stepId: number) => void
}

export default function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = step.id < currentStep

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isCompleted && 'bg-benow-blue-600 border-benow-blue-600 text-white',
                    isCurrent && 'border-benow-blue-600 text-benow-blue-600 bg-benow-blue-50',
                    !isCompleted && !isCurrent && 'border-gray-300 text-gray-400',
                    isClickable && 'cursor-pointer hover:border-benow-blue-400',
                    !isClickable && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isCurrent && 'text-benow-blue-600',
                      isCompleted && 'text-gray-700',
                      !isCompleted && !isCurrent && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors duration-200',
                    isCompleted ? 'bg-benow-blue-600' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

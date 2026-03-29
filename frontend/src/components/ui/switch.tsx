import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, onCheckedChange, className, disabled, ...props }, ref) => {
    const [isInternalChecked, setIsInternalChecked] = React.useState(defaultChecked || false)
    const isChecked = checked !== undefined ? checked : isInternalChecked

    const toggle = () => {
      if (disabled) return
      const newValue = !isChecked
      if (checked === undefined) {
        setIsInternalChecked(newValue)
      }
      onCheckedChange?.(newValue)
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={toggle}
        ref={ref}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800",
          className
        )}
        {...props}
      >
        <motion.span
          animate={{ x: isChecked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }

"use client"

import * as React from "react"
import { CheckCircle2, X, AlertCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps & { className?: string }>(
  ({ className, id, title, description, variant = "default", onClose, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
      if (props.duration && props.duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(() => onClose?.(), 300) // Wait for animation
        }, props.duration)
        return () => clearTimeout(timer)
      }
    }, [props.duration, onClose])

    const handleClose = () => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }

    const variants = {
      default: "bg-white border-[#E0DFDC] text-black",
      success: "bg-green-50 border-green-200 text-green-900",
      error: "bg-red-50 border-red-200 text-red-900",
      warning: "bg-amber-50 border-amber-200 text-amber-900",
      info: "bg-blue-50 border-blue-200 text-blue-900",
    }

    const icons = {
      default: null,
      success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      error: <XCircle className="w-5 h-5 text-red-600" />,
      warning: <AlertCircle className="w-5 h-5 text-amber-600" />,
      info: <Info className="w-5 h-5 text-blue-600" />,
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-[500px] transition-all duration-300",
          variants[variant],
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          className
        )}
        {...props}
      >
        {icons[variant] && <div className="flex-shrink-0 mt-0.5">{icons[variant]}</div>}
        <div className="flex-1 min-w-0">
          {title && <div className="font-semibold text-sm mb-1">{title}</div>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }


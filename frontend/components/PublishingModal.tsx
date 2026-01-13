"use client"

import * as React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import { AppLoader } from "./AppLoader"

interface PublishingModalProps {
  open: boolean
  status: "publishing" | "success" | "error"
  errorMessage?: string
  onClose?: () => void
}

export function PublishingModal({ open, status, errorMessage, onClose }: PublishingModalProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    // Load success sound
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/success-chime.mp3')
      audioRef.current.volume = 0.5 // Set volume to 50%
    }
  }, [])

  React.useEffect(() => {
    if (status === "success") {
      // Play success sound
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.log("Could not play sound:", err)
        })
      }
      
      // Auto-close after 2.5 seconds to show the success animation
      const timer = setTimeout(() => {
        onClose?.()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [status, onClose])

  const getTitle = () => {
    if (status === "publishing") return "Publishing to LinkedIn"
    if (status === "success") return "Published Successfully"
    if (status === "error") return "Publish Failed"
    return "Publishing Status"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not publishing
      if (!isOpen && status !== "publishing") {
        onClose?.();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-white border-[#E0DFDC] pointer-events-auto" showCloseButton={status !== "publishing"}>
        <DialogTitle className="sr-only">{getTitle()}</DialogTitle>
        <div className="flex flex-col items-center justify-center py-8 px-6">
          {status === "publishing" && (
            <>
              <div className="mb-6">
                <AppLoader size="lg" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-2">Publishing to LinkedIn</h3>
              <p className="text-[#666666] text-sm text-center">
                Please wait while we publish your post...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-12 h-12 text-green-600 animate-checkmark" />
                </div>
                {/* Animated rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 border-4 border-green-400 rounded-full animate-ring-expand" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 border-4 border-green-300 rounded-full animate-ring-expand" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2 animate-fade-in">
                Published Successfully!
              </h3>
              <p className="text-[#666666] text-sm text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
                Your post has been published to LinkedIn.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">Publish Failed</h3>
              <p className="text-[#666666] text-sm text-center mb-4">
                {errorMessage || "Failed to publish post to LinkedIn."}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


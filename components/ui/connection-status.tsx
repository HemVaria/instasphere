"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { useChannels } from "@/hooks/use-channels"
import { Button } from "@/components/ui/button"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasShownSuccess, setHasShownSuccess] = useState(false)
  const { error: authError, clearError: clearAuthError } = useAuth()
  const { error: chatError, isConnected, clearError: clearChatError } = useChat()
  const { error: channelsError, clearError: clearChannelsError } = useChannels()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Show success message only once when first connected
  useEffect(() => {
    if (isConnected && !authError && !chatError && !channelsError && isOnline && !hasShownSuccess) {
      setShowSuccess(true)
      setHasShownSuccess(true)
    }
  }, [isConnected, authError, chatError, channelsError, isOnline, hasShownSuccess])

  // Auto-hide the success banner after it appears
  useEffect(() => {
    if (!showSuccess) return
    const timer = setTimeout(() => setShowSuccess(false), 2000)
    return () => clearTimeout(timer)
  }, [showSuccess])

  const hasErrors = authError || chatError || channelsError

  // Only show status for critical errors or offline state
  const showStatus = !isOnline || hasErrors || showSuccess

  const handleRetry = () => {
    clearAuthError?.()
    clearChatError?.()
    clearChannelsError?.()
    window.location.reload()
  }

  const getErrorMessage = () => {
    if (!isOnline) return "No internet connection"
    if (authError) return `Authentication error`
    if (chatError) return `Connection error`
    if (channelsError) return `Service error`
    return "Connected successfully!"
  }

  if (!showStatus) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm shadow-lg ${
          showSuccess
            ? "bg-green-600 text-white"
            : !isOnline || hasErrors
              ? "bg-destructive text-destructive-foreground"
              : "bg-yellow-600 text-white"
        }`}
      >
        <div className="flex items-center justify-center gap-2 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            {showSuccess ? (
              <CheckCircle className="h-4 w-4" />
            ) : !isOnline ? (
              <WifiOff className="h-4 w-4" />
            ) : hasErrors ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            <span className="font-medium">{getErrorMessage()}</span>
          </div>

          {hasErrors && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs bg-white/10 border-white/20 hover:bg-white/20 ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

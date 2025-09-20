"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundCircles } from "@/components/ui/background-circles"
import { Auth } from "@/components/ui/auth-form"
import { SlideZone } from "@/components/slidezone/chat-interface"
import { ExplorePage } from "@/components/explore/explore-page"
import { SettingsPage } from "@/components/settings/settings-page"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ConnectionStatus } from "@/components/ui/connection-status"
import { useAuth } from "@/hooks/use-auth"
import { FeedPage } from "@/components/feed/feed-page"

type AppView = "landing" | "chat" | "explore" | "settings" | "feed"

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>("chat")
  const { user, loading, error } = useAuth()

  // Check environment variables on mount
  useEffect(() => {
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!hasSupabaseConfig) {
      console.error("❌ Missing Supabase environment variables!")
      console.error("Please check your .env.local file contains:")
      console.error("- NEXT_PUBLIC_SUPABASE_URL")
      console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY")
    } else {
      console.log("✅ Supabase environment variables found")
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Instasphere...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Connection Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry Connection
            </button>
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Troubleshooting
              </summary>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>• Check your internet connection</p>
                <p>• Verify Supabase environment variables</p>
                <p>• Ensure Supabase project is active</p>
                <p>• Check browser console for detailed errors</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div className="relative min-h-screen">
          <ConnectionStatus />
          <BackgroundCircles onSignInClick={() => setShowAuth(true)} />

          <AnimatePresence>
            {showAuth && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={() => setShowAuth(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Auth onClose={() => setShowAuth(false)} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <AnimatePresence mode="wait">
        {currentView === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SlideZone
              onNavigateToExplore={() => setCurrentView("explore")}
              onNavigateToSettings={() => setCurrentView("settings")}
              onNavigateToFeed={() => setCurrentView("feed")}
            />
          </motion.div>
        )}
        {currentView === "explore" && (
          <motion.div
            key="explore"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ExplorePage onNavigateBack={() => setCurrentView("chat")} />
          </motion.div>
        )}
        {currentView === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsPage onNavigateBack={() => setCurrentView("chat")} />
          </motion.div>
        )}
        {currentView === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <FeedPage onNavigateBack={() => setCurrentView("chat")} />
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}

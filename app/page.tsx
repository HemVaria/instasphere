"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BackgroundCircles } from "@/components/ui/background-circles"
import { Auth } from "@/components/ui/auth-form"
import { SlideZone } from "@/components/slidezone/chat-interface"
import { ExplorePage } from "@/components/explore/explore-page"
import { SettingsPage } from "@/components/settings/settings-page"
import { useAuth } from "@/hooks/use-auth"

type AppView = "landing" | "chat" | "explore" | "settings"

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>("chat")
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e1f2e]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        <BackgroundCircles onSignInClick={() => setShowAuth(true)} />

        <AnimatePresence>
          {showAuth && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
    )
  }

  return (
    <AnimatePresence mode="wait">
      {currentView === "chat" && (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SlideZone
            onNavigateToExplore={() => setCurrentView("explore")}
            onNavigateToSettings={() => setCurrentView("settings")}
          />
        </motion.div>
      )}
      {currentView === "explore" && (
        <motion.div
          key="explore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
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
          transition={{ duration: 0.3 }}
        >
          <SettingsPage onNavigateBack={() => setCurrentView("chat")} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

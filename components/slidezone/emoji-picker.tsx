"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  isOpen: boolean
  onClose: () => void
}

const emojiCategories = {
  "😀": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
  ],
  "👋": [
    "👋",
    "🤚",
    "🖐",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝",
    "👍",
  ],
  "❤️": [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "♥️",
  ],
  "🎉": [
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🎀",
    "🎂",
    "🍰",
    "🧁",
    "🎯",
    "🎮",
    "🎲",
    "🎸",
    "🎵",
    "🎶",
    "🎤",
    "🎧",
    "🎼",
    "🎹",
    "🥳",
    "🎭",
  ],
  "🔥": [
    "🔥",
    "💯",
    "⭐",
    "🌟",
    "✨",
    "⚡",
    "💥",
    "💫",
    "🌈",
    "☀️",
    "🌙",
    "⭐",
    "🌠",
    "☁️",
    "⛅",
    "🌤",
    "🌦",
    "🌧",
    "⛈",
    "🌩",
  ],
}

export function EmojiPicker({ onEmojiSelect, isOpen, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("😀")

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute bottom-full right-0 mb-2 rounded-lg shadow-xl p-4 w-80 max-w-[90vw] z-50"
          style={{ background: "var(--bg-1)", border: `1px solid var(--border)` }}
        >
          {/* Category Tabs */}
          <div className="flex gap-1 mb-3 pb-2 overflow-x-auto" style={{ borderBottom: `1px solid var(--border)` }}>
            {Object.keys(emojiCategories).map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(category)}
                className={`text-lg flex-shrink-0 ${activeCategory === category ? "" : ""}`}
                style={{ background: activeCategory === category ? "var(--bg-2)" : "transparent", color: "var(--text-1)" }}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {emojiCategories[activeCategory].map((emoji, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onEmojiSelect(emoji)
                  onClose()
                }}
                className="text-lg h-8 w-8 p-0"
                style={{ color: "var(--text-1)" }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

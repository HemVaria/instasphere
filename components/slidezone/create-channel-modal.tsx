"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Hash, Lock, Globe, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useChannels } from "@/hooks/use-channels"

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { createChannel } = useChannels()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await createChannel(name.trim(), description.trim() || undefined)
      setName("")
      setDescription("")
      setIsPrivate(false)
      onClose()
    } catch (error: any) {
      setError(error.message || "Failed to create channel")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    setIsPrivate(false)
    setError("")
    onClose()
  }

  // Preview the cleaned channel name
  const previewName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg shadow-xl mx-4"
            style={{ background: "var(--bg-1)", border: `1px solid var(--border)` }}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: "var(--text-1)" }}>Create Text Channel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="hover:bg-transparent"
                style={{ color: "var(--text-2)" }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(237,66,69,0.1)", border: "1px solid rgba(237,66,69,0.2)" }}>
                  <AlertCircle className="h-4 w-4 text-[#ed4245] flex-shrink-0" />
                  <p className="text-sm text-[#ed4245]">{error}</p>
                </div>
              )}

              {/* Channel Name */}
              <div className="space-y-2">
                <Label htmlFor="channel-name" className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                  Channel Name
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-3)" }} />
                  <Input
                    id="channel-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="awesome-channel"
                    className="pl-10"
                    style={{ background: "var(--bg-2)", borderColor: "var(--border)", color: "var(--text-1)" }}
                    required
                    maxLength={50}
                  />
                </div>
                {previewName && previewName !== name && (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Will be created as: <span style={{ color: "var(--text-1)" }}>#{previewName}</span>
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Channel names must be lowercase and can only contain letters, numbers, and dashes.
                </p>
              </div>

              {/* Channel Description */}
              <div className="space-y-2">
                <Label htmlFor="channel-description" className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                  Channel Description <span className="text-[#72767d]">(optional)</span>
                </Label>
                <Textarea
                  id="channel-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  className="resize-none"
                  style={{ background: "var(--bg-2)", borderColor: "var(--border)", color: "var(--text-1)" }}
                  rows={3}
                  maxLength={200}
                />
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Privacy Settings</Label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      !isPrivate
                        ? ""
                        : "hover:bg-transparent"
                    }`}
                    style={{
                      borderColor: !isPrivate ? "var(--brandPrimary)" : "var(--border)",
                      background: !isPrivate ? "color-mix(in oklab, var(--brandPrimary), black 90%)" : "var(--bg-2)",
                    }}
                  >
                    <Globe className="h-5 w-5 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                    <div className="text-left">
                      <p className="font-medium" style={{ color: "var(--text-1)" }}>Public</p>
                      <p className="text-sm" style={{ color: "var(--text-3)" }}>Everyone can view and join this channel</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isPrivate
                        ? ""
                        : "hover:bg-transparent"
                    }`}
                    style={{
                      borderColor: isPrivate ? "var(--brandPrimary)" : "var(--border)",
                      background: isPrivate ? "color-mix(in oklab, var(--brandPrimary), black 90%)" : "var(--bg-2)",
                    }}
                  >
                    <Lock className="h-5 w-5 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                    <div className="text-left">
                      <p className="font-medium" style={{ color: "var(--text-1)" }}>Private</p>
                      <p className="text-sm" style={{ color: "var(--text-3)" }}>Only selected members can view this channel</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                  style={{ color: "var(--text-2)" }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || isLoading}
                  className="w-full sm:w-auto text-white"
                  style={{ background: "var(--brandPrimary)", borderColor: "var(--brandPrimary)" }}
                >
                  {isLoading ? "Creating..." : "Create Channel"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

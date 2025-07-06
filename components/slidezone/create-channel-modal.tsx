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
            className="w-full max-w-md bg-[#36393f] rounded-lg shadow-xl mx-4"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#40444b]">
              <h2 className="text-lg sm:text-xl font-semibold text-[#dcddde]">Create Text Channel</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-[#ed4245] flex-shrink-0" />
                  <p className="text-sm text-[#ed4245]">{error}</p>
                </div>
              )}

              {/* Channel Name */}
              <div className="space-y-2">
                <Label htmlFor="channel-name" className="text-sm font-medium text-[#dcddde]">
                  Channel Name
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#72767d]" />
                  <Input
                    id="channel-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="awesome-channel"
                    className="pl-10 bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2]"
                    required
                    maxLength={50}
                  />
                </div>
                {previewName && previewName !== name && (
                  <p className="text-xs text-[#72767d]">
                    Will be created as: <span className="text-[#dcddde]">#{previewName}</span>
                  </p>
                )}
                <p className="text-xs text-[#72767d]">
                  Channel names must be lowercase and can only contain letters, numbers, and dashes.
                </p>
              </div>

              {/* Channel Description */}
              <div className="space-y-2">
                <Label htmlFor="channel-description" className="text-sm font-medium text-[#dcddde]">
                  Channel Description <span className="text-[#72767d]">(optional)</span>
                </Label>
                <Textarea
                  id="channel-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this channel about?"
                  className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[#dcddde]">Privacy Settings</Label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      !isPrivate
                        ? "border-[#5865f2] bg-[#5865f2]/10"
                        : "border-[#40444b] bg-[#2f3136] hover:bg-[#40444b]"
                    }`}
                  >
                    <Globe className="h-5 w-5 text-[#72767d] flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-[#dcddde]">Public</p>
                      <p className="text-sm text-[#72767d]">Everyone can view and join this channel</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isPrivate
                        ? "border-[#5865f2] bg-[#5865f2]/10"
                        : "border-[#40444b] bg-[#2f3136] hover:bg-[#40444b]"
                    }`}
                  >
                    <Lock className="h-5 w-5 text-[#72767d] flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-medium text-[#dcddde]">Private</p>
                      <p className="text-sm text-[#72767d]">Only selected members can view this channel</p>
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
                  className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || isLoading}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white w-full sm:w-auto"
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

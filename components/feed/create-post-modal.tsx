"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertCircle, ImageIcon, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePosts } from "@/hooks/use-posts"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createPost } = usePosts()

  useEffect(() => {
    // Cleanup object URL on unmount or change
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      setError("Unsupported image type. Use JPG, PNG, WEBP, or GIF.")
      return
    }
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      setError("Image too large (max 10MB).")
      return
    }
    setError("")
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    try {
      setIsUploading(true)
      const form = new FormData()
      form.append("file", imageFile)
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to upload image")
      }
      const data = (await res.json()) as { url: string }
      return data.url
    } catch (err: any) {
      console.error("Image upload failed:", err)
      // As a fallback, return a data URL if preview exists (demo/local mode)
      if (imagePreview?.startsWith("blob:")) {
        try {
          // Convert blob URL to data URL
          const blob = await (await fetch(imagePreview)).blob()
          const reader = new FileReader()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          return dataUrl
        } catch {
          return null
        }
      }
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Post title is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const imageUrl = await uploadImage()
      await createPost(title.trim(), content.trim() || undefined, imageUrl || null)
      setTitle("")
      setContent("")
      removeImage()
      onClose()
    } catch (error: any) {
      setError(error.message || "Failed to create post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    removeImage()
    setError("")
    onClose()
  }

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
              <h2 className="text-lg sm:text-xl font-semibold text-[#dcddde]">Create Post</h2>
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
              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-[#ed4245] flex-shrink-0" />
                  <p className="text-sm text-[#ed4245]">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="post-title" className="text-sm font-medium text-[#dcddde]">
                  Title
                </Label>
                <Input
                  id="post-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2]"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-content" className="text-sm font-medium text-[#dcddde]">
                  Content <span className="text-[#72767d]">(optional)</span>
                </Label>
                <Textarea
                  id="post-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share more details..."
                  className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] resize-none"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-[#72767d]">{content.length}/2000 characters</p>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#dcddde]">
                  Image <span className="text-[#72767d]">(optional)</span>
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                    id="post-image-input"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-transparent border-[#40444b] text-[#b9bbbe] hover:bg-[#40444b]"
                    disabled={isLoading || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    {imageFile ? "Change Image" : "Add Image"}
                  </Button>
                  {imageFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={removeImage}
                      className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
                      disabled={isLoading || isUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                {imagePreview && (
                  <div className="mt-3 rounded-lg border border-[#40444b] bg-[#2f3136] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Post image preview"
                      className="max-h-64 w-full object-contain rounded"
                    />
                    <p className="mt-2 text-xs text-[#72767d]">
                      {imageFile?.name} • {(imageFile!.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isLoading || isUploading}
                  className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title.trim() || isLoading || isUploading}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white w-full sm:w-auto"
                >
                  {isLoading || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isUploading ? "Uploading..." : "Creating..."}
                    </>
                  ) : (
                    "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

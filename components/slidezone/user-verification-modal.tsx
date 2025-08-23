"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Shield, ShieldCheck, Mail, Phone, CreditCard, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface UserVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onVerify: (userId: string, verificationType: "email" | "phone" | "identity") => Promise<void>
}

export function UserVerificationModal({ isOpen, onClose, userId, onVerify }: UserVerificationModalProps) {
  const [selectedVerificationType, setSelectedVerificationType] = useState<"email" | "phone" | "identity">("email")
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter verification code")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      await onVerify(userId, selectedVerificationType)
      onClose()
      setVerificationCode("")
    } catch (err: any) {
      setError(err.message || "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const verificationTypes = [
    {
      type: "email" as const,
      icon: Mail,
      title: "Email Verification",
      description: "Verify using email address",
      badge: "Basic",
      color: "blue",
    },
    {
      type: "phone" as const,
      icon: Phone,
      title: "Phone Verification",
      description: "Verify using phone number",
      badge: "Enhanced",
      color: "green",
    },
    {
      type: "identity" as const,
      icon: CreditCard,
      title: "Identity Verification",
      description: "Verify using government ID",
      badge: "Premium",
      color: "purple",
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#2a2a2a] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[#3a3a3a]"
          >
            <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-[#5865f2]" />
                <h2 className="text-xl font-semibold text-white">User Verification</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Verification Type Selection */}
              <div>
                <Label className="text-sm font-medium text-white mb-3 block">Choose Verification Method</Label>
                <div className="space-y-3">
                  {verificationTypes.map((type) => (
                    <div
                      key={type.type}
                      onClick={() => setSelectedVerificationType(type.type)}
                      className={`
                        flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors
                        ${
                          selectedVerificationType === type.type
                            ? "border-[#5865f2] bg-[#5865f2]/10"
                            : "border-[#3a3a3a] hover:border-[#4a4a4a] hover:bg-[#3a3a3a]"
                        }
                      `}
                    >
                      <type.icon
                        className={`h-5 w-5 ${
                          type.color === "blue"
                            ? "text-blue-400"
                            : type.color === "green"
                              ? "text-green-400"
                              : "text-purple-400"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{type.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              type.color === "blue"
                                ? "text-blue-400 border-blue-400"
                                : type.color === "green"
                                  ? "text-green-400 border-green-400"
                                  : "text-purple-400 border-purple-400"
                            }`}
                          >
                            {type.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#888]">{type.description}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedVerificationType === type.type ? "border-[#5865f2] bg-[#5865f2]" : "border-[#666]"
                        }`}
                      >
                        {selectedVerificationType === type.type && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Code Input */}
              <div>
                <Label htmlFor="verification-code" className="text-sm font-medium text-white mb-2 block">
                  Verification Code
                </Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-[#888] focus:border-[#5865f2]"
                />
                <p className="text-xs text-[#888] mt-2">
                  {selectedVerificationType === "email" && "Check your email for the verification code"}
                  {selectedVerificationType === "phone" && "Check your phone for the SMS verification code"}
                  {selectedVerificationType === "identity" && "Enter the code from your identity verification process"}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-[#ed4245] flex-shrink-0" />
                  <span className="text-sm text-[#ed4245]">{error}</span>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-[#3a3a3a] p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Security Notice</h4>
                    <p className="text-sm text-[#888]">
                      User verification helps maintain a safe and authentic community. Only verified users can send and
                      receive direct messages.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#3a3a3a]">
              <Button variant="ghost" onClick={onClose} className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]">
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isVerifying || !verificationCode.trim()}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
              >
                {isVerifying ? "Verifying..." : "Verify User"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

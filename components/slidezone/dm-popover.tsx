"use client"

import { useEffect, useRef, useState } from "react"
import { Search, MessageCircle, ShieldCheck, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDMs } from "@/hooks/use-dms"

interface DMPopoverProps {
  open: boolean
  onClose: () => void
  onStartDM: (userId: string) => void
}

export default function DMPopover({ open, onClose, onStartDM }: DMPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { dmUsers, error, clearError } = useDMs()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  const filteredUsers = dmUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getVerificationBadge = (user: any) => {
    if (!user.is_verified) {
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unverified
        </Badge>
      )
    }

    switch (user.verification_level) {
      case "email_verified":
        return (
          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Email
          </Badge>
        )
      case "phone_verified":
        return (
          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Phone
          </Badge>
        )
      case "identity_verified":
        return (
          <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
    }
  }

  return (
    <div className="dm-portal">
      <div ref={ref} role="dialog" aria-label="Direct Messages" className="dm-popover">
        <div className="dm-header">
          <span>Direct Messages</span>
          <button className="btn-icon" aria-label="Close" onClick={onClose}>×</button>
        </div>
        
        <div className="dm-search">
          <Search size={16} />
          <input 
            placeholder="Search verified users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {error && (
          <div className="dm-error">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} className="text-white hover:bg-[#c23616]">
              ×
            </Button>
          </div>
        )}

        <div className="dm-list">
          {filteredUsers.length === 0 ? (
            <div className="dm-empty">
              <MessageCircle className="h-8 w-8 text-[#7b7f86] mb-2" />
              <p className="text-sm text-[#7b7f86]">
                {searchQuery ? "No users found" : "No verified users available"}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                className="dm-item"
                onClick={() => {
                  onStartDM(user.id)
                  onClose()
                }}
                disabled={!user.is_verified}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#3B82F6] text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {user.is_online && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#1A1320]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{user.name}</p>
                    {getVerificationBadge(user)}
                  </div>
                  <p className="text-xs text-[#7b7f86]">
                    {user.is_online ? "Online" : "Offline"}
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-[#7b7f86]" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

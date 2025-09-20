"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  Settings,
  Smile,
  Hash,
  Plus,
  Search,
  MoreHorizontal,
  MessageCircle,
  Home,
  Bell,
  Compass,
  Send,
  Trash2,
  Rss,
  User,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Users2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { useChannels } from "@/hooks/use-channels"
import { useDMs } from "@/hooks/use-dms"
import { CreateChannelModal } from "./create-channel-modal"
import { UserVerificationModal } from "./user-verification-modal"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "./emoji-picker"
import { NotificationsPanel } from "./notifications-panel"
import ChannelsPopover from "./channels-popover"
import DMPopover from "./dm-popover"
import { useNotifications } from "@/hooks/use-notifications"
import appLogo from "@/logo.png"

interface SlideZoneProps {
  onNavigateToExplore: () => void
  onNavigateToSettings: () => void
  onNavigateToFeed: () => void
}

export function SlideZone({ onNavigateToExplore, onNavigateToSettings, onNavigateToFeed }: SlideZoneProps) {
  const { user, signOut } = useAuth()
  const { messages, users, sendMessage, isConnected, deleteMessage, activeChannel, setActiveChannel } = useChat()
  const { channels, createChannel, deleteChannel, loading: channelsLoading } = useChannels()
  const {
    directMessages,
    sendDirectMessage,
    deleteDirectMessage,
    activeDM,
    setActiveDM,
    dmUsers,
    loadDirectMessages,
    verifyUser,
    error: dmError,
    clearError,
  } = useDMs()

  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [selectedUserForVerification, setSelectedUserForVerification] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showPresence, setShowPresence] = useState(false)
  const [showChannelsPopover, setShowChannelsPopover] = useState(false)
  const [showDMPopover, setShowDMPopover] = useState(false)
  const [mobileView, setMobileView] = useState<"channels" | "chat" | "users">("chat")
  const [isMobile, setIsMobile] = useState(false)
  const [chatMode, setChatMode] = useState<"channel" | "dm">("channel")
  const { unreadCount } = useNotifications()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Set active channel to first available channel when channels load
  useEffect(() => {
    if (!activeChannel && channels.length > 0 && chatMode === "channel") {
      setActiveChannel(channels[0].id)
    }
  }, [channels, activeChannel, setActiveChannel, chatMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, directMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      if (chatMode === "channel" && activeChannel) {
        await sendMessage(newMessage, activeChannel)
      } else if (chatMode === "dm" && activeDM) {
        await sendDirectMessage(newMessage, activeDM)
      }
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const navigationItems = [
    {
      icon: Home,
      label: "Home",
      active: chatMode === "channel",
      onClick: () => setChatMode("channel"),
    },
    {
      icon: Bell,
      label: "Notifications",
      active: false,
      onClick: () => setShowNotifications(true),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: MessageCircle,
      label: "Messages",
      active: chatMode === "dm",
      onClick: () => setChatMode("dm"),
    },
    { icon: Rss, label: "Feed", active: false, onClick: onNavigateToFeed },
    { icon: Compass, label: "Explore", active: false, onClick: onNavigateToExplore },
  ]

  const activeChannelData = channels.find((ch) => ch.id === activeChannel) || {
    id: activeChannel,
    name: "loading...",
    description: "Loading channel...",
  }

  const activeDMUser = dmUsers.find((u) => u.id === activeDM)

  const handleDeleteChannel = async (channelId: string) => {
    if (confirm("Are you sure you want to delete this channel? All messages will be lost.")) {
      try {
        await deleteChannel(channelId)
        if (activeChannel === channelId && channels.length > 1) {
          const remainingChannels = channels.filter((c) => c.id !== channelId)
          if (remainingChannels.length > 0) {
            setActiveChannel(remainingChannels[0].id)
          }
        }
      } catch (error: any) {
        alert(error.message || "Failed to delete channel")
      }
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji)
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (chatMode === "channel") {
        await deleteMessage(messageId)
      } else {
        await deleteDirectMessage(messageId)
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete message")
    }
  }

  const handleStartDM = (userId: string) => {
    const targetUser = dmUsers.find((u) => u.id === userId)
    if (!targetUser?.is_verified) {
      alert("You can only message verified users")
      return
    }
    setChatMode("dm")
    setActiveDM(userId)
    loadDirectMessages(userId)
  }

  const handleVerifyUser = (userId: string) => {
    setSelectedUserForVerification(userId)
    setShowVerificationModal(true)
  }

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
            <Shield className="h-3 w-3 mr-1" />
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
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
    }
  }

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-0)" }}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: "var(--brandPrimary)" }}></div>
      </div>
    )
  }

  const currentMessages = chatMode === "channel" ? messages : directMessages
  const currentChatName = chatMode === "channel" ? activeChannelData.name : activeDMUser?.name || "Select a user"
  const currentChatDescription =
    chatMode === "channel"
      ? activeChannelData.description || `Welcome to #${activeChannelData.name}`
      : activeDMUser
        ? `Direct message with ${activeDMUser.name} ${activeDMUser.is_verified ? "(Verified)" : "(Unverified)"}`
        : "Select a verified user to start messaging"

  return (
    <div className="flex flex-col h-screen text-[#e6e7e9]">
      {/* Top Navigation Bar */}
      <div className="bg-[#222427] border-b border-[#2b2d31] px-6 py-3 flex items-center justify-between appbar">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image src={appLogo as any} alt="Instasphere logo" width={32} height={32} className="rounded-md object-cover shadow-sm" />
            <h1 className="text-xl font-semibold text-[#e6e7e9]">Instasphere</h1>
          </div>

          <nav className="flex items-center gap-2">
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className={cn("nav-item px-2 py-1.5", item.active ? "bg-[#2b2d31] text-[#e6e7e9]" : "text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c]")}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7b7f86]" />
            <Input
              placeholder="Search messages..."
              className="pl-8 w-56 h-9 bg-[#26282c] border-[#2b2d31] text-[#e6e7e9] placeholder:text-[#7b7f86] focus:border-[#3B82F6] rounded-full search"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChannelsPopover((v) => !v)}
            className="text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c] rounded-md"
            aria-haspopup="dialog"
            aria-expanded={showChannelsPopover}
            title="Channels"
          >
            <Hash className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPresence((v) => !v)}
            className="text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c] rounded-md"
            aria-haspopup="dialog"
            aria-expanded={showPresence}
            title="Online users"
          >
            <Users2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDMPopover((v) => !v)}
            className="text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c] rounded-md"
            aria-haspopup="dialog"
            aria-expanded={showDMPopover}
            title="Direct Messages"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToSettings}
            className="text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c] rounded-md"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Channels popover */}
      <ChannelsPopover
        open={showChannelsPopover}
        onClose={() => setShowChannelsPopover(false)}
        channels={channels as any}
        onOpenChannel={(id) => {
          setActiveChannel(id)
          setShowChannelsPopover(false)
        }}
        onCreateChannel={() => setShowCreateChannel(true)}
      />

      {/* DM popover */}
      <DMPopover
        open={showDMPopover}
        onClose={() => setShowDMPopover(false)}
        onStartDM={(userId) => {
          setChatMode("dm")
          setActiveDM(userId)
          loadDirectMessages(userId)
          setShowDMPopover(false)
        }}
      />

      {/* Error Display */}
      {dmError && (
        <div className="bg-[#ed4245] text-white px-4 py-2 text-sm flex items-center justify-between">
          <span>{dmError}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="text-white hover:bg-[#c23616]">
            ×
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-[#202225] border-r border-[#2b2d31] flex flex-col sidebar">
          <div className="p-4 border-b border-[#2b2d31]">
            <div className="flex items-center justify-between">
              <h2 className="text-xs tracking-wider text-[#7b7f86] uppercase">
                {chatMode === "channel" ? "Channels" : "Direct Messages"}
              </h2>
              {chatMode === "channel" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateChannel(true)}
                  className="h-8 w-8 text-[#aeb2b8] hover:text-[#e6e7e9] hover:bg-[#26282c]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {chatMode === "channel" ? (
              // Channels List
              <div className="space-y-2">
                {channels.map((channel) => (
                  <li key={channel.id}>
                    <button
                      onClick={() => setActiveChannel(channel.id)}
                      className={cn("channel-chip", activeChannel === channel.id ? "active" : undefined)}
                    >
                      <span className="dot" />
                      <span className="title">{channel.name}</span>
                      <span className="subtitle">{channel.description || "No description"}</span>
                    </button>
                  </li>
                ))}
              </div>
            ) : (
              // Direct Messages List - Only Verified Users
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] text-[#7b7f86] uppercase tracking-wide">Verified Users Only</div>
                {dmUsers
                  .filter((u) => u.is_verified)
                  .map((dmUser) => (
                    <div
                      key={dmUser.id}
                      onClick={() => handleStartDM(dmUser.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                        activeDM === dmUser.id
                          ? "bg-[#26282c] text-[#e6e7e9]"
                          : "text-[#aeb2b8] hover:bg-[#23262a] hover:text-[#e6e7e9]",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={dmUser.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-[#3B82F6] text-white">{dmUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#202225]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{dmUser.name}</p>
                          {getVerificationBadge(dmUser)}
                        </div>
                        <p className="text-xs text-[#7b7f86]">Online</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col chat">
          {/* Chat Header */}
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              {chatMode === "channel" ? (
                <>
                  <Hash className="h-5 w-5" style={{ color: "var(--text-3)" }} />
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{currentChatName}</h2>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{currentChatDescription}</p>
                  </div>
                </>
              ) : (
                <>
                  <User className="h-5 w-5" style={{ color: "var(--text-3)" }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>{currentChatName}</h2>
                      {activeDMUser && getVerificationBadge(activeDMUser)}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{currentChatDescription}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:text-white" style={{ background: "transparent" }}>
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-white" style={{ background: "transparent" }}>
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-16 w-16 text-[#7b7f86] mb-4" />
                <h3 className="text-lg font-medium text-[#e6e7e9] mb-2">No messages yet</h3>
                <p className="text-[#7b7f86]">
                  {chatMode === "dm" ? "Start a conversation with a verified user!" : "Start the conversation!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentMessages.map((msg, index) => {
                  const m: any = msg
                  const showTime =
                    index === 0 ||
                    new Date(m.created_at).getTime() - new Date((currentMessages[index - 1] as any).created_at).getTime() >
                      300000

                  const isOwnMessage = m.sender_id === user?.id || m.user_id === user?.id

                  return (
                    <div key={m.id}>
                      {showTime && (
                        <div className="text-center my-4">
                          <span className="timestamp-chip">
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="msg-group group"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0 msg-avatar">
                          <AvatarImage src={m.avatar_url || m.sender_avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-[#3B82F6] text-white">
                            {(m.user_name || m.sender_name || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#e6e7e9]">
                              {m.user_name || m.sender_name || "Unknown"}
                            </span>
                            <span className="text-xs text-[#7b7f86]">{formatTime(m.created_at)}</span>
                            {chatMode === "dm" && (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className={`msg-bubble ${isOwnMessage ? 'mine' : ''}`}>{m.content}</div>
                        </div>
                        {isOwnMessage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-white hover:text-[#ed4245]"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </motion.div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-3 border-t" style={{ background: "var(--bg-1)", borderColor: "var(--border)" }}>
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${chatMode === "channel" ? "#" + currentChatName : currentChatName}`}
                  className="rounded-full pr-12"
                  style={{ background: "color-mix(in oklab, var(--bg-2), white 3%)", borderColor: "transparent", color: "var(--text-1)" }}
                  disabled={
                    !isConnected ||
                    (chatMode === "channel" && !activeChannel) ||
                    (chatMode === "dm" && (!activeDM || !activeDMUser?.is_verified))
                  }
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-8 w-8"
                    style={{ color: "var(--text-2)" }}
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  !newMessage.trim() ||
                  !isConnected ||
                  (chatMode === "channel" && !activeChannel) ||
                  (chatMode === "dm" && (!activeDM || !activeDMUser?.is_verified))
                }
                className="text-white rounded-full"
                style={{ background: "var(--brandPrimary)" }}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Presence popover (replaces right sidebar) */}
        {showPresence && (
          <div className="presence-portal" onClick={() => setShowPresence(false)}>
            <div className="presence-popover" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Online users">
              <div className="presence-header">
                <span>Online — {(users || []).length}</span>
                <button className="btn-icon" aria-label="Close" onClick={() => setShowPresence(false)}>×</button>
              </div>
              <div className="presence-search">
                <Search size={16} />
                <input placeholder="Search people" />
              </div>
              <div className="presence-grid">
                {(users || []).map((onlineUser: any) => (
                  <button
                    key={onlineUser.id}
                    className="presence-item"
                    onClick={() => handleStartDM(onlineUser.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={onlineUser.avatar_url || "/placeholder.svg"} alt="" />
                    <span className="dot online" />
                    <div className="meta">
                      <div className="name">{onlineUser.name}</div>
                      <div className="role">Member</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateChannelModal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} />
      <UserVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userId={selectedUserForVerification}
        onVerify={verifyUser}
      />
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  )
}

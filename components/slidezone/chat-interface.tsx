"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
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
  Bot,
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
import { useNotifications } from "@/hooks/use-notifications"

interface SlideZoneProps {
  onNavigateToExplore: () => void
  onNavigateToSettings: () => void
  onNavigateToFeed: () => void
  onNavigateToChatbot?: () => void
}

export function SlideZone({ onNavigateToExplore, onNavigateToSettings, onNavigateToFeed, onNavigateToChatbot }: SlideZoneProps) {
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
    { icon: Bot, label: "AI Chatbot", active: false, onClick: onNavigateToChatbot },
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
      <div className="flex items-center justify-center min-h-screen bg-[#36393f]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
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
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-bold text-white">Instasphere</h1>
          </div>

          <nav className="flex items-center gap-2">
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative",
                  item.active ? "bg-[#4a4a4a] text-white" : "text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
            <Input
              placeholder="Search..."
              className="pl-10 w-64 bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-[#666] focus:border-[#5865f2] rounded-full"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateToSettings}
            className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a] rounded-lg"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

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
        <div className="w-80 bg-[#2a2a2a] border-r border-[#3a3a3a] flex flex-col">
          <div className="p-4 border-b border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {chatMode === "channel" ? "Channels" : "Direct Messages"}
              </h2>
              {chatMode === "channel" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateChannel(true)}
                  className="h-8 w-8 text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {chatMode === "channel" ? (
              // Channels List
              <div className="space-y-1">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-colors",
                      activeChannel === channel.id
                        ? "bg-[#4a4a4a] text-white"
                        : "text-[#b0b0b0] hover:bg-[#3a3a3a] hover:text-white",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Hash className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium truncate">{channel.name}</span>
                      </div>
                      <div className="text-sm text-[#888] truncate ml-7">{channel.description || "No description"}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChannel(channel.id)
                      }}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#888] hover:text-[#ed4245]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              // Direct Messages List - Only Verified Users
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs text-[#888] uppercase tracking-wide">Verified Users Only</div>
                {dmUsers
                  .filter((u) => u.is_verified)
                  .map((dmUser) => (
                    <div
                      key={dmUser.id}
                      onClick={() => handleStartDM(dmUser.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        activeDM === dmUser.id
                          ? "bg-[#4a4a4a] text-white"
                          : "text-[#b0b0b0] hover:bg-[#3a3a3a] hover:text-white",
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={dmUser.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-[#5865f2] text-white">{dmUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2a2a2a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{dmUser.name}</p>
                          {getVerificationBadge(dmUser)}
                        </div>
                        <p className="text-sm text-[#888]">Online</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {chatMode === "channel" ? (
                <>
                  <Hash className="h-6 w-6 text-[#888]" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">{currentChatName}</h2>
                    <p className="text-sm text-[#888]">{currentChatDescription}</p>
                  </div>
                </>
              ) : (
                <>
                  <User className="h-6 w-6 text-[#888]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-white">{currentChatName}</h2>
                      {activeDMUser && getVerificationBadge(activeDMUser)}
                    </div>
                    <p className="text-sm text-[#888]">{currentChatDescription}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]">
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a]">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-16 w-16 text-[#666] mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No messages yet</h3>
                <p className="text-[#888]">
                  {chatMode === "dm" ? "Start a conversation with a verified user!" : "Start the conversation!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentMessages.map((msg, index) => {
                  const showTime =
                    index === 0 ||
                    new Date(msg.created_at).getTime() - new Date(currentMessages[index - 1].created_at).getTime() >
                      300000

                  const isOwnMessage = msg.sender_id === user?.id || msg.user_id === user?.id

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center my-4">
                          <span className="text-xs text-[#888] bg-[#3a3a3a] px-3 py-1 rounded-full">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-4 group hover:bg-[#2a2a2a] p-3 rounded-lg"
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={msg.avatar_url || msg.sender_avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-[#5865f2] text-white">
                            {(msg.user_name || msg.sender_name || "U").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-white">
                              {msg.user_name || msg.sender_name || "Unknown"}
                            </span>
                            <span className="text-xs text-[#888]">{formatTime(msg.created_at)}</span>
                            {chatMode === "dm" && (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="bg-[#3a3a3a] rounded-lg p-3 max-w-fit">
                            <p className="text-white break-words">{msg.content}</p>
                          </div>
                        </div>
                        {isOwnMessage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#888] hover:text-[#ed4245]"
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
          <div className="bg-[#2a2a2a] p-4">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-[#b0b0b0] hover:text-white hover:bg-[#3a3a3a] rounded-full"
              >
                <Plus className="h-5 w-5" />
              </Button>

              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${chatMode === "channel" ? "#" + currentChatName : currentChatName}`}
                  className="bg-[#3a3a3a] border-[#4a4a4a] text-white placeholder:text-[#888] focus:border-[#5865f2] rounded-full pr-12"
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
                    className="h-8 w-8 text-[#b0b0b0] hover:text-white"
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
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-full"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Online Users */}
        <div className="w-64 bg-[#2a2a2a] border-l border-[#3a3a3a] flex flex-col">
          <div className="p-4 border-b border-[#3a3a3a]">
            <h3 className="text-lg font-semibold text-white">
              Online — {chatMode === "dm" ? dmUsers.filter((u) => u.is_verified).length : users.length}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {(chatMode === "dm" ? dmUsers.filter((u) => u.is_verified) : users).map((onlineUser) => (
                <div
                  key={onlineUser.id}
                  onClick={() => (chatMode === "dm" ? handleStartDM(onlineUser.id) : handleStartDM(onlineUser.id))}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#3a3a3a] transition-colors cursor-pointer group"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={onlineUser.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                        {onlineUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2a2a2a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white truncate">{onlineUser.name}</p>
                      {chatMode === "dm" && onlineUser.is_verified && getVerificationBadge(onlineUser)}
                    </div>
                    <p className="text-xs text-[#3ba55c]">Online</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#888] hover:text-white"
                  >
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
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

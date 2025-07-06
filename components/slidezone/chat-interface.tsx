"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Lock,
  Trash2,
  Menu,
  X,
  ArrowLeft,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useChat } from "@/hooks/use-chat"
import { useChannels } from "@/hooks/use-channels"
import { CreateChannelModal } from "./create-channel-modal"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "./emoji-picker"
import { NotificationsPanel } from "./notifications-panel"
import { useNotifications } from "@/hooks/use-notifications"

interface Message {
  id: string
  content: string
  user_id: string
  user_name: string
  created_at: string
  avatar_url?: string
}

interface SlideZoneProps {
  onNavigateToExplore: () => void
  onNavigateToSettings: () => void
}

export function SlideZone({ onNavigateToExplore, onNavigateToSettings }: SlideZoneProps) {
  const { user, signOut } = useAuth()
  const { messages, users, sendMessage, isConnected, deleteMessage, activeChannel, setActiveChannel } = useChat()
  const { channels, createChannel, deleteChannel, loading: channelsLoading } = useChannels()
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileView, setMobileView] = useState<"channels" | "chat" | "users">("chat")
  const [isMobile, setIsMobile] = useState(false)
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
    if (!activeChannel && channels.length > 0) {
      setActiveChannel(channels[0].id)
    }
  }, [channels, activeChannel, setActiveChannel])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel) return

    try {
      await sendMessage(newMessage, activeChannel)
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
    { icon: Home, label: "Home", active: true },
    {
      icon: Bell,
      label: "Notifications",
      active: false,
      onClick: () => setShowNotifications(true),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { icon: MessageCircle, label: "Messages", active: false },
    { icon: Compass, label: "Explore", active: false, onClick: onNavigateToExplore },
  ]

  const activeChannelData = channels.find((ch) => ch.id === activeChannel) || {
    id: activeChannel,
    name: "loading...",
    description: "Loading channel...",
  }

  const handleDeleteChannel = async (channelId: string) => {
    if (confirm("Are you sure you want to delete this channel? All messages will be lost.")) {
      try {
        await deleteChannel(channelId)
        // If we deleted the active channel, switch to the first available channel
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
      await deleteMessage(messageId)
    } catch (error: any) {
      alert(error.message || "Failed to delete message")
    }
  }

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#36393f]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-[#36393f] text-white">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#40444b] bg-[#2f3136]">
          <div className="flex items-center gap-3">
            {mobileView === "chat" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileView("channels")}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {mobileView === "channels" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileView("chat")}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-[#dcddde]">
                {mobileView === "channels" ? "Channels" : `#${activeChannelData.name}`}
              </h1>
              {mobileView === "chat" && (
                <p className="text-xs text-[#72767d]">
                  {activeChannelData.description || `Welcome to #${activeChannelData.name}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {mobileView === "chat" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileView("users")}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <Users className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Channels View */}
            {mobileView === "channels" && (
              <motion.div
                key="channels"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="h-full bg-[#2f3136] p-4 overflow-y-auto"
              >
                {/* Navigation */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#dcddde] mb-3">Navigation</h3>
                  <div className="space-y-2">
                    {navigationItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={item.onClick}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                          item.active
                            ? "bg-[#5865f2] text-white"
                            : "text-[#b9bbbe] hover:text-white hover:bg-[#40444b]",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-[#ed4245] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#72767d]" />
                  <Input
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2]"
                  />
                </div>

                {/* Channels */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#dcddde]">Text Channels</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCreateChannel(true)}
                      className="h-8 w-8 text-[#72767d] hover:text-[#dcddde]"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setActiveChannel(channel.id)
                          setMobileView("chat")
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors group",
                          activeChannel === channel.id ? "bg-[#40444b]" : "hover:bg-[#40444b]",
                        )}
                      >
                        <Hash className="h-4 w-4 text-[#72767d]" />
                        {channel.is_private && <Lock className="h-3 w-3 text-[#72767d]" />}
                        <span className="text-sm text-[#dcddde] flex-1 text-left truncate">{channel.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteChannel(channel.id)
                          }}
                          className="h-6 w-6 text-[#72767d] hover:text-[#ed4245] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="border-t border-[#40444b] pt-4">
                  <div className="space-y-2">
                    <button
                      onClick={onNavigateToSettings}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-[#b9bbbe] hover:text-white hover:bg-[#40444b] transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Settings</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chat View */}
            {mobileView === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center">
                    <span className="text-xs text-[#72767d] bg-[#2f3136] px-3 py-1 rounded-full">Today</span>
                  </div>

                  <AnimatePresence>
                    {messages.map((message, index) => {
                      const isOwnMessage = message.user_id === user?.id
                      const showTime =
                        index === 0 ||
                        new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() >
                          300000

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="space-y-2"
                        >
                          {showTime && (
                            <div className="text-center">
                              <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                            </div>
                          )}

                          <div className={cn("flex gap-3", isOwnMessage ? "justify-end" : "justify-start")}>
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={message.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                  {message.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            <div className={cn("max-w-[75%] group", isOwnMessage ? "order-first" : "")}>
                              {!isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-[#dcddde]">{message.user_name}</span>
                                  <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                                </div>
                              )}

                              <div className="relative">
                                <div
                                  className={cn(
                                    "px-3 py-2 rounded-lg",
                                    isOwnMessage ? "bg-[#5865f2] text-white ml-auto" : "bg-[#40444b] text-[#dcddde]",
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                </div>

                                {(isOwnMessage || user?.user_metadata?.role === "admin") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="absolute -top-2 -right-2 h-6 w-6 bg-[#ed4245] hover:bg-[#c23616] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {isOwnMessage && (
                                <div className="flex items-center justify-end mt-1">
                                  <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                                  <div className="w-3 h-3 text-[#5865f2] ml-1 text-xs">✓✓</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 bg-[#36393f] border-t border-[#40444b]">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${activeChannelData.name}`}
                        className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] pr-10"
                        disabled={!isConnected || !activeChannel}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-[#b9bbbe] hover:text-white"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      <EmojiPicker
                        isOpen={showEmojiPicker}
                        onClose={() => setShowEmojiPicker(false)}
                        onEmojiSelect={handleEmojiSelect}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || !isConnected || !activeChannel}
                      className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Users View */}
            {mobileView === "users" && (
              <motion.div
                key="users"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="h-full bg-[#2f3136] p-4 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#dcddde]">Online Users</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileView("chat")}
                    className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {users.map((chatUser) => (
                    <motion.div
                      key={chatUser.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#40444b] transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={chatUser.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                            {chatUser.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#dcddde] truncate">{chatUser.name}</p>
                        <p className="text-xs text-[#72767d]">Online</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Channel Modal */}
        <CreateChannelModal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} />

        {/* Notifications Panel */}
        <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    )
  }

  // Desktop Layout (existing code with responsive improvements)
  return (
    <div className="flex h-screen bg-[#36393f] text-white">
      {/* Desktop Collapsible Left Sidebar */}
      <motion.div
        className="bg-[#2f3136] border-r border-[#40444b] flex flex-col relative z-10 hidden md:flex"
        initial={{ width: 72 }}
        animate={{ width: sidebarExpanded ? 280 : 72 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Navigation Icons */}
        <div className="p-3">
          <div className="flex flex-col gap-2">
            {navigationItems.map((item, index) => (
              <motion.button
                key={index}
                onClick={item.onClick}
                className={cn(
                  "relative flex items-center w-full rounded-xl transition-all duration-200 group",
                  item.active
                    ? "bg-[#5865f2] text-white hover:bg-[#4752c4]"
                    : "text-[#b9bbbe] hover:text-white hover:bg-[#40444b]",
                )}
                initial={{ width: 48 }}
                animate={{ width: sidebarExpanded ? "100%" : 48 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="flex items-center w-12 h-12 justify-center flex-shrink-0 relative">
                  <item.icon className="h-6 w-6" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap ml-4 overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-[#40444b] my-2" />

        {/* Message Category Section */}
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 px-3"
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#dcddde] mb-1">Message category</h3>
                <p className="text-xs text-[#72767d]">{user?.email}</p>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#72767d]" />
                <Input
                  placeholder="Search Message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] h-8 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#72767d] hover:text-[#dcddde]"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>

              {/* Channels Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#72767d] uppercase tracking-wide">Text Channels</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreateChannel(true)}
                    className="h-4 w-4 text-[#72767d] hover:text-[#dcddde]"
                    title="Create Channel"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {/* Dynamic Channels */}
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer group",
                        activeChannel === channel.id ? "bg-[#40444b]" : "hover:bg-[#40444b]",
                      )}
                      onClick={() => setActiveChannel(channel.id)}
                    >
                      <Hash className="h-4 w-4 text-[#72767d]" />
                      {channel.is_private && <Lock className="h-3 w-3 text-[#72767d]" />}
                      <span className="text-sm text-[#dcddde] flex-1 truncate">{channel.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChannel(channel.id)
                        }}
                        className="h-4 w-4 text-[#72767d] hover:text-[#ed4245] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Channel"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Settings */}
        <div className="p-3 border-t border-[#40444b]">
          <div className="flex flex-col gap-2">
            <motion.button
              onClick={onNavigateToSettings}
              className="relative flex items-center w-full rounded-xl transition-all duration-200 text-[#b9bbbe] hover:text-white hover:bg-[#40444b] group"
              initial={{ width: 48 }}
              animate={{ width: sidebarExpanded ? "100%" : 48 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex items-center w-12 h-12 justify-center flex-shrink-0">
                <Settings className="h-6 w-6" />
              </div>
              <AnimatePresence>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap ml-4 overflow-hidden"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="p-4 border-b border-[#40444b] bg-[#36393f] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileView("channels")}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Hash className="h-6 w-6 text-[#72767d] flex-shrink-0" />
              {activeChannelData.is_private && <Lock className="h-4 w-4 text-[#72767d] flex-shrink-0" />}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#dcddde] truncate">{activeChannelData.name}</h2>
                <p className="text-sm text-[#72767d] truncate">
                  {activeChannelData.description || `Welcome to #${activeChannelData.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(true)}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ed4245] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center">
            <span className="text-xs text-[#72767d] bg-[#2f3136] px-3 py-1 rounded-full">Today</span>
          </div>

          <AnimatePresence>
            {messages.map((message, index) => {
              const isOwnMessage = message.user_id === user?.id
              const showTime =
                index === 0 ||
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  {showTime && (
                    <div className="text-center">
                      <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                    </div>
                  )}

                  <div className={cn("flex gap-3", isOwnMessage ? "justify-end" : "justify-start")}>
                    {!isOwnMessage && (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={message.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                          {message.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={cn("max-w-xs lg:max-w-md group", isOwnMessage ? "order-first" : "")}>
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[#dcddde]">{message.user_name}</span>
                          <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                        </div>
                      )}

                      <div className="relative">
                        <div
                          className={cn(
                            "px-4 py-2 rounded-lg",
                            isOwnMessage ? "bg-[#5865f2] text-white ml-auto" : "bg-[#40444b] text-[#dcddde]",
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>

                        {(isOwnMessage || user?.user_metadata?.role === "admin") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -right-2 h-6 w-6 bg-[#ed4245] hover:bg-[#c23616] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {isOwnMessage && (
                        <div className="flex items-center justify-end mt-1">
                          <span className="text-xs text-[#72767d]">{formatTime(message.created_at)}</span>
                          <div className="w-4 h-4 text-[#5865f2] ml-1">✓✓</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 bg-[#36393f] flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] flex-shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative min-w-0">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${activeChannelData.name}`}
                className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] pr-12"
                disabled={!isConnected || !activeChannel}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-8 w-8 text-[#b9bbbe] hover:text-white"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!newMessage.trim() || !isConnected || !activeChannel}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-6 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Online Users Only (Desktop) */}
      <div className="w-60 bg-[#2f3136] border-l border-[#40444b] flex-col hidden lg:flex">
        {/* Online Users */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-[#dcddde] mb-3">Online — {users.length}</h3>
          <div className="space-y-1">
            {users.map((chatUser) => (
              <motion.div
                key={chatUser.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[#40444b] transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={chatUser.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                      {chatUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#dcddde] truncate">{chatUser.name}</p>
                  <p className="text-xs text-[#72767d]">Online</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal isOpen={showCreateChannel} onClose={() => setShowCreateChannel(false)} />

      {/* Notifications Panel */}
      <NotificationsPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  )
}

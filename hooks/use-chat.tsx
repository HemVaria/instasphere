"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface Message {
  id: string
  content: string
  user_id: string
  user_name: string
  created_at: string
  avatar_url?: string
  likes?: number
  replies?: number
  channel?: string
}

interface User {
  id: string
  name: string
  avatar_url?: string
  is_online: boolean
  last_seen?: string
  status?: string
}

interface ChatContextType {
  messages: Message[]
  users: User[]
  sendMessage: (content: string, channelId?: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  likeMessage: (messageId: string) => Promise<void>
  isConnected: boolean
  activeChannel: string
  setActiveChannel: (channel: string) => void
  loadMessagesForChannel: (channelId: string) => Promise<void>
  error: string | null
  clearError: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [activeChannel, setActiveChannel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const { user } = useAuth()

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!user || !activeChannel) {
      setIsConnected(false)
      return
    }

    let mounted = true
    let messagesChannel: any
    let presenceChannel: any
    let connectionTimeout: NodeJS.Timeout

    const setupRealtimeSubscriptions = async () => {
      try {
        const supabase = createClient()

        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          if (mounted && !isConnected) {
            console.warn("Real-time connection taking longer than expected")
            setIsConnected(true) // Assume connected to prevent infinite loading
          }
        }, 3000)

        // Set up real-time subscription for messages
        messagesChannel = supabase
          .channel(`messages:${activeChannel}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `channel=eq.${activeChannel}`,
            },
            (payload) => {
              if (!mounted) return
              const newMessage = payload.new as Message
              console.log("📨 New message received:", newMessage)
              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((msg) => msg.id === newMessage.id)) return prev
                return [...prev, newMessage]
              })
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `channel=eq.${activeChannel}`,
            },
            (payload) => {
              if (!mounted) return
              const updatedMessage = payload.new as Message
              console.log("📝 Message updated:", updatedMessage)
              setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
            },
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "messages",
            },
            (payload) => {
              if (!mounted) return
              const deletedMessage = payload.old as Message
              console.log("🗑️ Message deleted:", deletedMessage)
              setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
            },
          )
          .subscribe((status) => {
            if (!mounted) return
            console.log("📡 Messages subscription status:", status)

            clearTimeout(connectionTimeout)

            if (status === "SUBSCRIBED") {
              setIsConnected(true)
              setError(null)
              setConnectionAttempts(0)
            } else if (status === "CHANNEL_ERROR") {
              setConnectionAttempts((prev) => prev + 1)
              if (connectionAttempts < 3) {
                console.log("Retrying connection...")
                // Don't show error on first few attempts
              } else {
                setError("Failed to connect to real-time messages")
              }
            }
          })

        // Set up real-time subscription for user presence
        presenceChannel = supabase
          .channel("online-users")
          .on("presence", { event: "sync" }, () => {
            if (!mounted) return
            const state = presenceChannel.presenceState()
            const onlineUsers = Object.values(state).flat() as User[]
            console.log("👥 Online users updated:", onlineUsers.length)
            setUsers(onlineUsers)
          })
          .on("presence", { event: "join" }, ({ key, newPresences }) => {
            if (!mounted) return
            console.log("👋 User joined:", newPresences)
          })
          .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
            if (!mounted) return
            console.log("👋 User left:", leftPresences)
          })
          .subscribe(async (status) => {
            if (!mounted) return
            console.log("👥 Presence subscription status:", status)
            if (status === "SUBSCRIBED") {
              await presenceChannel.track({
                id: user.id,
                name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
                avatar_url: user.user_metadata?.avatar_url,
                is_online: true,
                last_seen: new Date().toISOString(),
                status: "online",
              })
            }
          })

        // Load initial messages and update presence
        await Promise.all([loadMessagesForChannel(activeChannel), updateUserPresence()])
      } catch (err: any) {
        if (!mounted) return
        console.error("Failed to setup real-time subscriptions:", err)

        // Only show error for critical failures
        if (connectionAttempts >= 2) {
          setError(`Connection failed: ${err.message}`)
        }

        // Still mark as connected to prevent infinite loading
        setIsConnected(true)
      }
    }

    setupRealtimeSubscriptions()

    return () => {
      mounted = false
      clearTimeout(connectionTimeout)
      if (messagesChannel) {
        messagesChannel.unsubscribe()
      }
      if (presenceChannel) {
        presenceChannel.unsubscribe()
      }
    }
  }, [user, activeChannel, connectionAttempts])

  const loadMessagesForChannel = async (channelId: string) => {
    if (!channelId) return

    try {
      setError(null)
      const supabase = createClient()

      console.log("📥 Loading messages for channel:", channelId)

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("channel", channelId)
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("Error loading messages:", error)
        // Don't show error for missing tables during initial setup
        if (!error.message?.includes("does not exist")) {
          setError(`Failed to load messages: ${error.message}`)
        }
        return
      }

      console.log("✅ Messages loaded:", data?.length || 0)
      setMessages(data || [])
    } catch (err: any) {
      console.error("Network error loading messages:", err)
      // Don't show network errors during initial load
    }
  }

  const updateUserPresence = async () => {
    if (!user) return

    try {
      const supabase = createClient()

      // First check if the user_presence table exists
      const { error: checkError } = await supabase
        .from('user_presence')
        .select('user_id')
        .limit(1)
      
      // If table doesn't exist, silently return
      if (checkError && checkError.message.includes("does not exist")) {
        return
      }

      const { error } = await supabase.from("user_presence").upsert({
        user_id: user.id,
        last_seen: new Date().toISOString(),
        is_online: true,
        status: "online",
      })

      if (error) {
        console.error("Error updating presence:", error)
      }
    } catch (err: any) {
      console.error("Network error updating presence:", err)
    }
  }

  const sendMessage = async (content: string, channelId: string = activeChannel) => {
    if (!user || !channelId || !content.trim()) return

    try {
      setError(null)
      const supabase = createClient()

      const messageData = {
        content: content.trim(),
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url,
        likes: 0,
        replies: 0,
        channel: channelId,
      }

      console.log("📤 Sending message:", messageData)

      const { data, error } = await supabase.from("messages").insert(messageData).select().single()

      if (error) {
        console.error("Error sending message:", error)
        setError(`Failed to send message: ${error.message}`)
        throw error
      }

      console.log("✅ Message sent successfully")
    } catch (err: any) {
      console.error("Network error sending message:", err)
      setError(`Failed to send message: ${err.message}`)
      throw err
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      const message = messages.find((m) => m.id === messageId)
      if (!message || (message.user_id !== user.id && user.user_metadata?.role !== "admin")) {
        throw new Error("You can only delete your own messages")
      }

      const { error } = await supabase.from("messages").delete().eq("id", messageId)

      if (error) {
        console.error("Error deleting message:", error)
        setError(`Failed to delete message: ${error.message}`)
        throw error
      }

      console.log("🗑️ Message deleted successfully")
    } catch (err: any) {
      console.error("Error deleting message:", err)
      throw err
    }
  }

  const likeMessage = async (messageId: string) => {
    try {
      setError(null)
      const supabase = createClient()

      const message = messages.find((m) => m.id === messageId)
      if (!message) return

      const { error } = await supabase
        .from("messages")
        .update({ likes: (message.likes || 0) + 1 })
        .eq("id", messageId)

      if (error) {
        console.error("Error liking message:", error)
        setError(`Failed to like message: ${error.message}`)
        throw error
      }

      console.log("❤️ Message liked successfully")
    } catch (err: any) {
      console.error("Network error liking message:", err)
      setError(`Failed to like message: ${err.message}`)
      throw err
    }
  }

  const handleSetActiveChannel = (channel: string) => {
    console.log("🔄 Switching to channel:", channel)
    setActiveChannel(channel)
    setError(null)
    setMessages([]) // Clear messages when switching channels
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        users,
        sendMessage,
        deleteMessage,
        likeMessage,
        isConnected,
        activeChannel,
        setActiveChannel: handleSetActiveChannel,
        loadMessagesForChannel,
        error,
        clearError,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

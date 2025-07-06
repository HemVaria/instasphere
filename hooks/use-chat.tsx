"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [activeChannel, setActiveChannel] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user || !activeChannel) return

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message
          // Only add message if it belongs to the active channel
          if (newMessage.channel === activeChannel) {
            setMessages((prev) => [...prev, newMessage])
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          if (updatedMessage.channel === activeChannel) {
            setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
          }
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
          const deletedMessage = payload.old as Message
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    // Set up real-time subscription for user presence
    const presenceChannel = supabase
      .channel("online-users")
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState()
        const onlineUsers = Object.values(state).flat() as User[]
        setUsers(onlineUsers)
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences)
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences)
      })
      .subscribe(async (status) => {
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

    // Load initial messages for active channel
    loadMessagesForChannel(activeChannel)

    // Update user presence in database
    updateUserPresence()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [user, supabase, activeChannel])

  const loadMessagesForChannel = async (channelId: string) => {
    if (!channelId) return

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel", channelId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error loading messages:", error)
      return
    }

    setMessages(data || [])
  }

  const updateUserPresence = async () => {
    if (!user) return

    const { error } = await supabase.from("user_presence").upsert({
      user_id: user.id,
      last_seen: new Date().toISOString(),
      is_online: true,
      status: "online",
    })

    if (error) {
      console.error("Error updating presence:", error)
    }
  }

  const sendMessage = async (content: string, channelId: string = activeChannel) => {
    if (!user || !channelId) return

    const messageData = {
      content,
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
      avatar_url: user.user_metadata?.avatar_url,
      likes: 0,
      replies: 0,
      channel: channelId,
    }

    const { error } = await supabase.from("messages").insert(messageData)

    if (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!user) return

    // Check if user owns the message or is admin
    const message = messages.find((m) => m.id === messageId)
    if (!message || (message.user_id !== user.id && user.user_metadata?.role !== "admin")) {
      throw new Error("You can only delete your own messages")
    }

    const { error } = await supabase.from("messages").delete().eq("id", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  const likeMessage = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const { error } = await supabase
      .from("messages")
      .update({ likes: (message.likes || 0) + 1 })
      .eq("id", messageId)

    if (error) {
      console.error("Error liking message:", error)
      throw error
    }
  }

  const handleSetActiveChannel = (channel: string) => {
    setActiveChannel(channel)
    loadMessagesForChannel(channel)
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

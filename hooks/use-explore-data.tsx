"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"
import { useChat } from "./use-chat"

interface ExploreStats {
  totalUsers: number
  messagesToday: number
  totalMessages: number
  totalChannels: number
}

interface RecentMessage {
  id: string
  content: string
  user_name: string
  avatar_url?: string
  created_at: string
  likes?: number
  replies?: number
  channel_name?: string
}

interface TopChannel {
  id: string
  name: string
  description?: string
  message_count: number
}

interface OnlineUser {
  id: string
  name: string
  avatar_url?: string
  is_online: boolean
}

export function useExploreData() {
  const [stats, setStats] = useState<ExploreStats>({
    totalUsers: 0,
    messagesToday: 0,
    totalMessages: 0,
    totalChannels: 0,
  })
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [topChannels, setTopChannels] = useState<TopChannel[]>([])
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()
  const { users } = useChat()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    loadExploreData()
  }, [user])

  // Update online users from chat context
  useEffect(() => {
    setOnlineUsers(users)
  }, [users])

  const loadExploreData = async () => {
    try {
      setLoading(true)

      // Load all data in parallel
      const [statsResult, messagesResult, channelsResult] = await Promise.all([
        loadStats(),
        loadRecentMessages(),
        loadTopChannels(),
      ])

      if (statsResult) setStats(statsResult)
      if (messagesResult) setRecentMessages(messagesResult)
      if (channelsResult) setTopChannels(channelsResult)
    } catch (error) {
      console.error("Error loading explore data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (): Promise<ExploreStats | null> => {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase.from("user_presence").select("*", { count: "exact", head: true })

      // Get total messages count
      const { count: totalMessages } = await supabase.from("messages").select("*", { count: "exact", head: true })

      // Get messages from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: messagesToday } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString())

      // Get total channels count
      const { count: totalChannels } = await supabase.from("channels").select("*", { count: "exact", head: true })

      return {
        totalUsers: totalUsers || 0,
        messagesToday: messagesToday || 0,
        totalMessages: totalMessages || 0,
        totalChannels: totalChannels || 0,
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      return null
    }
  }

  const loadRecentMessages = async (): Promise<RecentMessage[]> => {
    try {
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          user_name,
          avatar_url,
          created_at,
          likes,
          replies,
          channel
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error loading recent messages:", error)
        return []
      }

      // Get channel names for messages
      const messagesWithChannels = await Promise.all(
        (messages || []).map(async (message) => {
          if (message.channel) {
            const { data: channel } = await supabase.from("channels").select("name").eq("id", message.channel).single()

            return {
              ...message,
              channel_name: channel?.name || "general",
            }
          }
          return {
            ...message,
            channel_name: "general",
          }
        }),
      )

      return messagesWithChannels
    } catch (error) {
      console.error("Error loading recent messages:", error)
      return []
    }
  }

  const loadTopChannels = async (): Promise<TopChannel[]> => {
    try {
      // Get channels with message counts
      const { data: channels, error } = await supabase
        .from("channels")
        .select(`
          id,
          name,
          description
        `)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading channels:", error)
        return []
      }

      // Get message counts for each channel
      const channelsWithCounts = await Promise.all(
        (channels || []).map(async (channel) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("channel", channel.id)

          return {
            ...channel,
            message_count: count || 0,
          }
        }),
      )

      // Sort by message count and return top 5
      return channelsWithCounts.sort((a, b) => b.message_count - a.message_count).slice(0, 5)
    } catch (error) {
      console.error("Error loading top channels:", error)
      return []
    }
  }

  return {
    stats,
    recentMessages,
    topChannels,
    onlineUsers,
    loading,
    refresh: loadExploreData,
  }
}

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface Channel {
  id: string
  name: string
  description?: string
  is_private?: boolean
  created_by: string
  created_at: string
}

interface ChannelsContextType {
  channels: Channel[]
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  createChannel: (name: string, description?: string) => Promise<void>
  deleteChannel: (channelId: string) => Promise<void>
  isAdmin: boolean
  loading: boolean
  error: string | null
  clearError: () => void
}

const ChannelsContext = createContext<ChannelsContextType | undefined>(undefined)

export function ChannelsProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const isAdmin = !!user

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let mounted = true
    let channelsSubscription: any

    const initializeChannels = async () => {
      try {
        await loadChannels()

        // Set up real-time subscription for channels
        const supabase = createClient()
        channelsSubscription = supabase
          .channel("channels")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "channels",
            },
            (payload) => {
              if (!mounted) return
              console.log("🏷️ Channels updated:", payload)
              loadChannels()
            },
          )
          .subscribe((status) => {
            if (!mounted) return
            console.log("🏷️ Channels subscription status:", status)
            if (status === "CHANNEL_ERROR") {
              setError("Failed to connect to channels service")
            }
          })
      } catch (err: any) {
        if (mounted) {
          console.error("Failed to initialize channels:", err)
          setError(`Failed to connect to channels: ${err.message}`)
          setLoading(false)
        }
      }
    }

    initializeChannels()

    return () => {
      mounted = false
      if (channelsSubscription) {
        channelsSubscription.unsubscribe()
      }
    }
  }, [user])

  const loadChannels = async () => {
    try {
      setError(null)
      const supabase = createClient()

      console.log("📥 Loading channels...")

      const { data, error } = await supabase.from("channels").select("*").order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading channels:", error)
        setError(`Failed to load channels: ${error.message}`)
        return
      }

      console.log("✅ Channels loaded:", data?.length || 0)
      setChannels(data || [])

      // Set active channel to first available channel if not set
      if (!activeChannel && data && data.length > 0) {
        setActiveChannel(data[0].id)
      }
    } catch (err: any) {
      console.error("Network error loading channels:", err)
      setError(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createChannel = async (name: string, description?: string) => {
    if (!user) throw new Error("You must be logged in to create channels")

    try {
      setError(null)
      const supabase = createClient()

      const cleanName = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

      if (!cleanName) throw new Error("Please provide a valid channel name")

      console.log("📤 Creating channel:", cleanName)

      const { data, error } = await supabase
        .from("channels")
        .insert({
          name: cleanName,
          description,
          is_private: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          throw new Error("A channel with this name already exists")
        }
        console.error("Error creating channel:", error)
        throw new Error(`Failed to create channel: ${error.message}`)
      }

      console.log("✅ Channel created successfully:", data)
    } catch (err: any) {
      console.error("Error creating channel:", err)
      throw err
    }
  }

  const deleteChannel = async (channelId: string) => {
    if (!user) throw new Error("You must be logged in to delete channels")

    try {
      setError(null)
      const supabase = createClient()

      const channel = channels.find((c) => c.id === channelId)
      if (!channel || (channel.created_by !== user.id && user.user_metadata?.role !== "admin")) {
        throw new Error("You can only delete channels you created")
      }

      console.log("🗑️ Deleting channel:", channelId)

      const { error } = await supabase.from("channels").delete().eq("id", channelId)

      if (error) {
        console.error("Error deleting channel:", error)
        throw new Error(`Failed to delete channel: ${error.message}`)
      }

      console.log("✅ Channel deleted successfully")
    } catch (err: any) {
      console.error("Error deleting channel:", err)
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <ChannelsContext.Provider
      value={{
        channels,
        activeChannel,
        setActiveChannel,
        createChannel,
        deleteChannel,
        isAdmin,
        loading,
        error,
        clearError,
      }}
    >
      {children}
    </ChannelsContext.Provider>
  )
}

export function useChannels() {
  const context = useContext(ChannelsContext)
  if (context === undefined) {
    throw new Error("useChannels must be used within a ChannelsProvider")
  }
  return context
}

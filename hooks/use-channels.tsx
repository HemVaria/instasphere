"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface Channel {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  is_private?: boolean
}

interface ChannelsContextType {
  channels: Channel[]
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  createChannel: (name: string, description?: string, isPrivate?: boolean) => Promise<void>
  deleteChannel: (channelId: string) => Promise<void>
  isAdmin: boolean
  loading: boolean
}

const ChannelsContext = createContext<ChannelsContextType | undefined>(undefined)

export function ChannelsProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState("")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  // For now, any authenticated user can create channels (you can modify this logic)
  const isAdmin = !!user

  useEffect(() => {
    if (!user) return

    loadChannels()

    // Set up real-time subscription for channels
    const channelsSubscription = supabase
      .channel("channels")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "channels",
        },
        () => {
          loadChannels()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelsSubscription)
    }
  }, [user, supabase])

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase.from("channels").select("*").order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading channels:", error)
        return
      }

      setChannels(data || [])

      // Set active channel to first available channel if not set
      if (!activeChannel && data && data.length > 0) {
        setActiveChannel(data[0].id)
      }
    } catch (error) {
      console.error("Error loading channels:", error)
    } finally {
      setLoading(false)
    }
  }

  const createChannel = async (name: string, description?: string, isPrivate = false) => {
    if (!user) throw new Error("You must be logged in to create channels")

    // sanitise
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    if (!cleanName) throw new Error("Please provide a valid channel name")

    const { error } = await supabase.from("channels").insert({
      name: cleanName,
      description,
      created_by: user.id,
    })

    if (error) {
      if (error.code === "23505") throw new Error("A channel with this name already exists")
      console.error("Error creating channel:", error)
      throw new Error("Failed to create channel")
    }
  }

  const deleteChannel = async (channelId: string) => {
    if (!user) {
      throw new Error("You must be logged in to delete channels")
    }

    // Check if user created the channel or is admin
    const channel = channels.find((c) => c.id === channelId)
    if (!channel || (channel.created_by !== user.id && user.user_metadata?.role !== "admin")) {
      throw new Error("You can only delete channels you created")
    }

    const { error } = await supabase.from("channels").delete().eq("id", channelId)

    if (error) {
      console.error("Error deleting channel:", error)
      throw new Error("Failed to delete channel")
    }
  }

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

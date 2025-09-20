"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface DirectMessage {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  sender_name: string
  receiver_name: string
  sender_avatar?: string
  receiver_avatar?: string
  created_at: string
  is_deleted?: boolean
  deleted_at?: string
}

interface DMUser {
  id: string
  name: string
  email: string
  avatar_url?: string
  is_online: boolean
  is_verified: boolean
  verification_level: "unverified" | "email_verified" | "phone_verified" | "identity_verified"
  last_seen?: string
  joined_at: string
}

interface DMsContextType {
  directMessages: DirectMessage[]
  dmUsers: DMUser[]
  sendDirectMessage: (content: string, receiverId: string) => Promise<void>
  deleteDirectMessage: (messageId: string) => Promise<void>
  activeDM: string
  setActiveDM: (userId: string) => void
  loadDirectMessages: (userId: string) => Promise<void>
  isConnected: boolean
  error: string | null
  clearError: () => void
  verifyUser: (userId: string, verificationType: "email" | "phone" | "identity") => Promise<void>
}

const DMsContext = createContext<DMsContextType | undefined>(undefined)

export function DMsProvider({ children }: { children: React.ReactNode }) {
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [dmUsers, setDMUsers] = useState<DMUser[]>([])
  const [activeDM, setActiveDM] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const clearError = useCallback(() => setError(null), [])

  // Load verified users for DMs
  useEffect(() => {
    if (!user) return

    const loadVerifiedDMUsers = async () => {
      try {
        // Always show demo users for testing - you can remove this later
        const demoUsers: DMUser[] = [
          {
            id: "demo-user-1",
            name: "Alice Johnson",
            email: "alice@demo.com",
            avatar_url: "/placeholder.svg",
            is_online: true,
            is_verified: true,
            verification_level: "email_verified",
            last_seen: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          {
            id: "demo-user-2", 
            name: "Bob Smith",
            email: "bob@demo.com",
            avatar_url: "/placeholder.svg",
            is_online: true,
            is_verified: true,
            verification_level: "phone_verified",
            last_seen: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          {
            id: "demo-user-3",
            name: "Carol Davis", 
            email: "carol@demo.com",
            avatar_url: "/placeholder.svg",
            is_online: false,
            is_verified: true,
            verification_level: "identity_verified",
            last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            joined_at: new Date().toISOString(),
          },
          {
            id: "demo-user-4",
            name: "David Wilson",
            email: "david@demo.com",
            avatar_url: "/placeholder.svg",
            is_online: true,
            is_verified: true,
            verification_level: "email_verified",
            last_seen: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          {
            id: "demo-user-5",
            name: "Emma Brown",
            email: "emma@demo.com",
            avatar_url: "/placeholder.svg",
            is_online: true,
            is_verified: true,
            verification_level: "phone_verified",
            last_seen: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          }
        ]
        
        console.log("📝 Loading demo users for testing:", demoUsers.length)
        setDMUsers(demoUsers)

        // Try to load real users as well (optional)
        try {
          const supabase = createClient()
          const { data: verifiedUsers, error } = await supabase
            .from("user_verification")
            .select(`
              user_id,
              is_verified,
              verification_level,
              verified_at,
              user_presence(
                user_id,
                is_online,
                last_seen,
                name,
                email,
                avatar_url,
                joined_at
              )
            `)
            .neq("user_id", user.id)
            .eq("is_verified", true)

          if (!error && verifiedUsers && verifiedUsers.length > 0) {
            const realUsers: DMUser[] = verifiedUsers
              .filter((userData) => userData.user_presence && userData.user_presence.is_online)
              .map((userData) => ({
                id: userData.user_id,
                name: userData.user_presence.name || userData.user_presence.email?.split("@")[0] || "Anonymous",
                email: userData.user_presence.email || "",
                avatar_url: userData.user_presence.avatar_url,
                is_online: userData.user_presence.is_online,
                is_verified: userData.is_verified,
                verification_level: userData.verification_level,
                last_seen: userData.user_presence.last_seen,
                joined_at: userData.user_presence.joined_at,
              }))
            
            console.log("✅ Found real verified users:", realUsers.length)
            // Combine demo users with real users
            setDMUsers([...demoUsers, ...realUsers])
          }
        } catch (realUserError) {
          console.log("⚠️ Could not load real users, using demo users only:", realUserError)
        }
      } catch (err) {
        console.error("Error loading DM users:", err)
        setError("Failed to load users")
      }
    }

    loadVerifiedDMUsers()
  }, [user])

  // Set up real-time subscription for direct messages
  useEffect(() => {
    if (!user || !activeDM) {
      setIsConnected(false)
      return
    }

    let mounted = true
    let dmChannel: any

    const setupDMSubscription = async () => {
      try {
        // Handle demo users - no real-time subscription needed
        if (activeDM.startsWith("demo-user-")) {
          console.log("📱 Using demo mode for DM with:", activeDM)
          setIsConnected(true)
          setError(null)
          return
        }

        const supabase = createClient()

        // Verify that the target user is verified before setting up subscription
        const { data: targetUserVerification } = await supabase
          .from("user_verification")
          .select("is_verified, verification_level")
          .eq("user_id", activeDM)
          .single()

        if (!targetUserVerification?.is_verified) {
          setError("Cannot message unverified users")
          return
        }

        // Set up real-time subscription for direct messages
        dmChannel = supabase
          .channel(`direct_messages:${user.id}:${activeDM}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "direct_messages",
              filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${activeDM}),and(sender_id.eq.${activeDM},receiver_id.eq.${user.id}))`,
            },
            (payload) => {
              if (!mounted) return

              if (payload.eventType === "INSERT") {
                const newMessage = payload.new as DirectMessage
                console.log("📨 New DM received:", newMessage)
                setDirectMessages((prev) => {
                  if (prev.some((msg) => msg.id === newMessage.id)) return prev
                  return [...prev, newMessage]
                })
              } else if (payload.eventType === "UPDATE") {
                const updatedMessage = payload.new as DirectMessage
                console.log("📝 DM updated:", updatedMessage)
                setDirectMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)))
              } else if (payload.eventType === "DELETE") {
                const deletedMessage = payload.old as DirectMessage
                console.log("🗑️ DM deleted:", deletedMessage)
                setDirectMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id))
              }
            },
          )
          .subscribe((status) => {
            if (!mounted) return
            console.log("📡 DM subscription status:", status)

            if (status === "SUBSCRIBED") {
              setIsConnected(true)
              setError(null)
            } else if (status === "CHANNEL_ERROR") {
              setError("Failed to connect to direct messages")
            }
          })
      } catch (err: any) {
        if (!mounted) return
        console.error("Failed to setup DM subscription:", err)
        setError(`Connection failed: ${err.message}`)
        setIsConnected(true)
      }
    }

    setupDMSubscription()

    return () => {
      mounted = false
      if (dmChannel) {
        dmChannel.unsubscribe()
      }
    }
  }, [user, activeDM])

  const loadDirectMessages = async (userId: string) => {
    if (!user || !userId) return

    try {
      setError(null)
      
      // Handle demo users - load from local storage or show empty
      if (userId.startsWith("demo-user-")) {
        console.log("📥 Loading demo DMs with:", userId)
        
        // Add some demo messages for testing
        const demoMessages: DirectMessage[] = [
          {
            id: `demo-msg-1-${userId}`,
            content: "Hey! How are you doing today?",
            sender_id: userId,
            receiver_id: user.id,
            sender_name: dmUsers.find(u => u.id === userId)?.name || "Demo User",
            receiver_name: user.user_metadata?.name || user.email?.split("@")[0] || "You",
            sender_avatar: dmUsers.find(u => u.id === userId)?.avatar_url,
            receiver_avatar: user.user_metadata?.avatar_url,
            created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            is_deleted: false,
          },
          {
            id: `demo-msg-2-${userId}`,
            content: "I'm working on a new project. It's really exciting!",
            sender_id: userId,
            receiver_id: user.id,
            sender_name: dmUsers.find(u => u.id === userId)?.name || "Demo User",
            receiver_name: user.user_metadata?.name || user.email?.split("@")[0] || "You",
            sender_avatar: dmUsers.find(u => u.id === userId)?.avatar_url,
            receiver_avatar: user.user_metadata?.avatar_url,
            created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            is_deleted: false,
          }
        ]
        
        setDirectMessages(demoMessages)
        return
      }

      const supabase = createClient()

      // Verify target user is verified
      const { data: targetUserVerification } = await supabase
        .from("user_verification")
        .select("is_verified")
        .eq("user_id", userId)
        .single()

      if (!targetUserVerification?.is_verified) {
        setError("Cannot load messages from unverified users")
        return
      }

      console.log("📥 Loading DMs with verified user:", userId)

      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true })
        .limit(100)

      if (error) {
        console.error("Error loading DMs:", error)
        if (!error.message?.includes("does not exist")) {
          setError(`Failed to load messages: ${error.message}`)
        }
        return
      }

      // Filter out deleted messages for display
      const activeMessages = (data || []).filter((msg) => !msg.is_deleted)
      console.log("✅ DMs loaded:", activeMessages.length)
      setDirectMessages(activeMessages)
    } catch (err: any) {
      console.error("Network error loading DMs:", err)
    }
  }

  const sendDirectMessage = async (content: string, receiverId: string) => {
    if (!user || !receiverId || !content.trim()) return

    try {
      setError(null)
      
      // Handle demo users (for testing)
      if (receiverId.startsWith("demo-user-")) {
        const demoMessage: DirectMessage = {
          id: `demo-${Date.now()}`,
          content: content.trim(),
          sender_id: user.id,
          receiver_id: receiverId,
          sender_name: user.user_metadata?.name || user.email?.split("@")[0] || "You",
          receiver_name: dmUsers.find(u => u.id === receiverId)?.name || "Demo User",
          sender_avatar: user.user_metadata?.avatar_url,
          receiver_avatar: dmUsers.find(u => u.id === receiverId)?.avatar_url,
          created_at: new Date().toISOString(),
          is_deleted: false,
        }
        
        console.log("📤 Sending demo DM:", demoMessage)
        setDirectMessages(prev => [...prev, demoMessage])
        return
      }

      const supabase = createClient()

      // Verify both users are verified
      const { data: senderVerification } = await supabase
        .from("user_verification")
        .select("is_verified")
        .eq("user_id", user.id)
        .single()

      const { data: receiverVerification } = await supabase
        .from("user_verification")
        .select("is_verified")
        .eq("user_id", receiverId)
        .single()

      if (!senderVerification?.is_verified) {
        setError("You must be verified to send messages")
        return
      }

      if (!receiverVerification?.is_verified) {
        setError("Cannot send messages to unverified users")
        return
      }

      const receiverUser = dmUsers.find((u) => u.id === receiverId)
      const messageData = {
        content: content.trim(),
        sender_id: user.id,
        receiver_id: receiverId,
        sender_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
        receiver_name: receiverUser?.name || "Unknown",
        sender_avatar: user.user_metadata?.avatar_url,
        receiver_avatar: receiverUser?.avatar_url,
        is_deleted: false,
      }

      console.log("📤 Sending DM to verified user:", messageData)

      const { data, error } = await supabase.from("direct_messages").insert(messageData).select().single()

      if (error) {
        console.error("Error sending DM:", error)
        setError(`Failed to send message: ${error.message}`)
        throw error
      }

      console.log("✅ DM sent successfully to verified user")

      // Create a notification for the receiver
      try {
        await supabase.from("notifications").insert({
          user_id: receiverId,
          type: "message",
          title: `New message from ${messageData.sender_name}`,
          message: messageData.content,
          data: { dmWithUserId: user.id, messageId: (data as any)?.id },
          read: false,
        })
      } catch (notifyErr) {
        console.warn("⚠️ Failed to create DM notification:", notifyErr)
      }
    } catch (err: any) {
      console.error("Network error sending DM:", err)
      setError(`Failed to send message: ${err.message}`)
      throw err
    }
  }

  const deleteDirectMessage = async (messageId: string) => {
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      // Check if user owns the message
      const message = directMessages.find((m) => m.id === messageId)
      if (!message || message.sender_id !== user.id) {
        throw new Error("You can only delete your own messages")
      }

      // Soft delete - mark as deleted instead of removing from database
      const { error } = await supabase
        .from("direct_messages")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          content: "[Message deleted]",
        })
        .eq("id", messageId)
        .eq("sender_id", user.id) // Extra security check

      if (error) {
        console.error("Error deleting DM:", error)
        setError(`Failed to delete message: ${error.message}`)
        throw error
      }

      // Remove from local state immediately for better UX
      setDirectMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      console.log("🗑️ DM deleted successfully")
    } catch (err: any) {
      console.error("Error deleting DM:", err)
      setError(`Failed to delete message: ${err.message}`)
      throw err
    }
  }

  const verifyUser = async (userId: string, verificationType: "email" | "phone" | "identity") => {
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      // Only allow self-verification or admin verification
      if (userId !== user.id && user.user_metadata?.role !== "admin") {
        throw new Error("You can only verify your own account")
      }

      const verificationLevel =
        verificationType === "email"
          ? "email_verified"
          : verificationType === "phone"
            ? "phone_verified"
            : "identity_verified"

      const { error } = await supabase.from("user_verification").upsert({
        user_id: userId,
        is_verified: true,
        verification_level: verificationLevel,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })

      if (error) {
        console.error("Error verifying user:", error)
        setError(`Failed to verify user: ${error.message}`)
        throw error
      }

      console.log("✅ User verified successfully")

      // Reload DM users to include newly verified user
      if (userId !== user.id) {
        // Reload the DM users list
        window.location.reload() // Simple reload for now
      }
    } catch (err: any) {
      console.error("Error verifying user:", err)
      setError(`Failed to verify user: ${err.message}`)
      throw err
    }
  }

  const handleSetActiveDM = (userId: string) => {
    console.log("🔄 Switching to DM with verified user:", userId)
    setActiveDM(userId)
    setError(null)
    setDirectMessages([])
    loadDirectMessages(userId)
  }

  return (
    <DMsContext.Provider
      value={{
        directMessages,
        dmUsers,
        sendDirectMessage,
        deleteDirectMessage,
        activeDM,
        setActiveDM: handleSetActiveDM,
        loadDirectMessages,
        isConnected,
        error,
        clearError,
        verifyUser,
      }}
    >
      {children}
    </DMsContext.Provider>
  )
}

export function useDMs() {
  const context = useContext(DMsContext)
  if (context === undefined) {
    throw new Error("useDMs must be used within a DMsProvider")
  }
  return context
}

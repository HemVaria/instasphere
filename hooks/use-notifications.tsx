"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface Notification {
  id: string
  user_id: string
  type: "message" | "mention" | "channel_invite" | "system"
  title: string
  message: string
  read: boolean
  created_at: string
  data?: any
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  createNotification: (type: string, title: string, message: string, data?: any) => Promise<void>
  error: string | null
  clearError: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const { user } = useAuth()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!user || !notificationsEnabled) return

    let mounted = true
    let notificationsChannel: any

    const initializeNotifications = async () => {
      try {
        await loadNotifications()

        // Set up real-time subscription for notifications
        const supabase = createClient()
        notificationsChannel = supabase
          .channel("notifications")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return
              const newNotification = payload.new as Notification
              console.log("🔔 New notification:", newNotification)
              setNotifications((prev) => [newNotification, ...prev])
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return
              const updatedNotification = payload.new as Notification
              console.log("📝 Notification updated:", updatedNotification)
              setNotifications((prev) =>
                prev.map((notif) => (notif.id === updatedNotification.id ? updatedNotification : notif)),
              )
            },
          )
          .subscribe((status) => {
            if (!mounted) return
            console.log("🔔 Notifications subscription status:", status)
            if (status === "CHANNEL_ERROR") {
              setError("Failed to connect to notifications service")
            }
          })
      } catch (err: any) {
        if (mounted) {
          console.error("Failed to initialize notifications:", err)
          setError(`Failed to connect to notifications: ${err.message}`)
        }
      }
    }

    initializeNotifications()

    return () => {
      mounted = false
      if (notificationsChannel) {
        notificationsChannel.unsubscribe()
      }
    }
  }, [user, notificationsEnabled])

  const loadNotifications = async () => {
    if (!user || !notificationsEnabled) return

    try {
      setError(null)
      const supabase = createClient()

      console.log("📥 Loading notifications...")

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("Notifications table not found – disabling notifications")
          setNotificationsEnabled(false)
          setNotifications([])
          return
        }
        console.error("Error loading notifications:", error)
        setError(`Failed to load notifications: ${error.message}`)
        return
      }

      console.log("✅ Notifications loaded:", data?.length || 0)
      setNotifications(data || [])
    } catch (err: any) {
      console.error("Network error loading notifications:", err)
      setError(`Network error: ${err.message}`)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!notificationsEnabled || !user) return

    try {
      setError(null)
      const supabase = createClient()

      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

      if (error && error.code !== "42P01") {
        console.error("Error marking notification as read:", error)
        setError(`Failed to mark notification as read: ${error.message}`)
        throw error
      }

      console.log("✅ Notification marked as read")
    } catch (err: any) {
      console.error("Error marking notification as read:", err)
      throw err
    }
  }

  const markAllAsRead = async () => {
    if (!notificationsEnabled || !user) return

    try {
      setError(null)
      const supabase = createClient()

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error && error.code !== "42P01") {
        console.error("Error marking all notifications as read:", error)
        setError(`Failed to mark notifications as read: ${error.message}`)
        throw error
      }

      console.log("✅ All notifications marked as read")
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err)
      throw err
    }
  }

  const createNotification = async (type: string, title: string, message: string, data?: any) => {
    if (!notificationsEnabled || !user) return

    try {
      setError(null)
      const supabase = createClient()

      const { error } = await supabase.from("notifications").insert({
        user_id: user.id,
        type,
        title,
        message,
        data,
        read: false,
      })

      if (error && error.code !== "42P01") {
        console.error("Error creating notification:", error)
        setError(`Failed to create notification: ${error.message}`)
        throw error
      }

      console.log("✅ Notification created")
    } catch (err: any) {
      console.error("Error creating notification:", err)
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        createNotification,
        error,
        clearError,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

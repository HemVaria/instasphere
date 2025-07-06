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
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()
  const supabase = createClient()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!user) return

    loadNotifications()

    // Set up real-time subscription for notifications
    const notificationsChannel = supabase
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
          const newNotification = payload.new as Notification
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
          const updatedNotification = payload.new as Notification
          setNotifications((prev) =>
            prev.map((notif) => (notif.id === updatedNotification.id ? updatedNotification : notif)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notificationsChannel)
    }
  }, [user, supabase])

  const loadNotifications = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Ignore missing-table error to keep UI running
    if (error) {
      if (error.code === "42P01") {
        console.warn("Notifications table not found - run the SQL migration to enable notifications")
        setNotifications([])
        return
      }
      console.error("Error loading notifications:", error)
      return
    }
    setNotifications(data || [])
  }

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

    if (error) {
      if (error.code === "42P01") return
      console.error("Error marking notification as read:", error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) {
      if (error.code === "42P01") return
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  }

  const createNotification = async (type: string, title: string, message: string, data?: any) => {
    if (!user) return

    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      type,
      title,
      message,
      data,
      read: false,
    })

    if (error) {
      if (error.code === "42P01") {
        // Table isn’t ready yet; silently ignore to avoid breaking UX
        return
      }
      console.error("Error creating notification:", error)
      throw error
    }
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        createNotification,
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

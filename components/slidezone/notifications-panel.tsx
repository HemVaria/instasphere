"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Check, CheckCheck, Bell, MessageCircle, Hash, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-4 w-4" />
      case "mention":
        return <Hash className="h-4 w-4" />
      case "channel_invite":
        return <Users className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "message":
        return "text-blue-400"
      case "mention":
        return "text-yellow-400"
      case "channel_invite":
        return "text-green-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#2f3136] border-l border-[#40444b] shadow-xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#40444b]">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#dcddde]" />
              <h2 className="text-lg font-semibold text-[#dcddde]">Notifications</h2>
              {unreadCount > 0 && <Badge className="bg-[#5865f2] text-white">{unreadCount}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Bell className="h-12 w-12 text-[#72767d] mb-4" />
                <h3 className="text-lg font-medium text-[#dcddde] mb-2">No notifications</h3>
                <p className="text-sm text-[#72767d]">You're all caught up!</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.read ? "bg-[#36393f] border-[#40444b]" : "bg-[#5865f2]/10 border-[#5865f2]/30"
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-[#dcddde] truncate">{notification.title}</h4>
                          {!notification.read && <div className="w-2 h-2 bg-[#5865f2] rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-[#b9bbbe] mb-2 break-words">{notification.message}</p>
                        <p className="text-xs text-[#72767d]">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="h-6 w-6 text-[#72767d] hover:text-[#dcddde] flex-shrink-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

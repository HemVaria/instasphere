"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Search, TrendingUp, Users, MessageCircle, Heart, Share, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Waves } from "@/components/ui/waves-background"
import { useExploreData } from "@/hooks/use-explore-data"
import { formatDistanceToNow } from "date-fns"

interface ExplorePageProps {
  onNavigateBack: () => void
}

export function ExplorePage({ onNavigateBack }: ExplorePageProps) {
  const { stats, recentMessages, topChannels, onlineUsers, loading } = useExploreData()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#36393f] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#36393f] text-white relative overflow-hidden">
      {/* Animated Background */}
      <Waves
        lineColor="rgba(88, 101, 242, 0.2)"
        backgroundColor="transparent"
        waveSpeedX={0.015}
        waveSpeedY={0.008}
        waveAmpX={35}
        waveAmpY={18}
        friction={0.92}
        tension={0.008}
        maxCursorMove={100}
        xGap={15}
        yGap={40}
        className="opacity-60"
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 sm:p-6 border-b border-[#40444b] bg-[#2f3136]/90 backdrop-blur-sm"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNavigateBack}
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Hash className="h-8 w-8 text-[#5865f2]" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#dcddde]">Explore</h1>
                  <p className="text-sm text-[#72767d]">Discover trending topics and conversations</p>
                </div>
              </div>
            </div>

            <div className="relative w-64 sm:w-96 hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#72767d]" />
              <Input
                placeholder="Search topics, users, or content..."
                className="pl-10 bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2]"
              />
            </div>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Section */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-r from-[#5865f2]/20 to-[#7289da]/20 border-[#5865f2]/30 p-6 sm:p-8 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-[#dcddde]">Welcome to Explore</h2>
                  <p className="text-[#b9bbbe] mb-6">
                    Discover trending conversations, connect with like-minded people, and explore new ideas in the
                    Instasphere community.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button className="bg-[#5865f2] hover:bg-[#4752c4]">Start Exploring</Button>
                    <Button
                      variant="outline"
                      className="border-[#5865f2] text-[#5865f2] hover:bg-[#5865f2]/10 bg-transparent"
                    >
                      Join Community
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-[#dcddde]">
                  <MessageCircle className="h-5 w-5 text-[#5865f2]" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentMessages.length === 0 ? (
                    <Card className="bg-[#2f3136] border-[#40444b] p-6 text-center">
                      <p className="text-[#72767d]">No recent messages yet. Start a conversation!</p>
                    </Card>
                  ) : (
                    recentMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <Card className="bg-[#2f3136] border-[#40444b] p-4 sm:p-6 hover:bg-[#32353b] transition-colors">
                          <div className="flex gap-4">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                              <AvatarImage src={message.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-[#5865f2] text-white">
                                {message.user_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-[#dcddde]">{message.user_name}</span>
                                <span className="text-sm text-[#72767d]">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                                <Badge className="bg-[#5865f2]/20 text-[#5865f2] border-[#5865f2]/30">
                                  #{message.channel_name || "general"}
                                </Badge>
                              </div>
                              <p className="text-[#b9bbbe] mb-4 break-words">{message.content}</p>
                              <div className="flex items-center gap-6 text-[#72767d]">
                                <button className="flex items-center gap-2 hover:text-[#ed4245] transition-colors">
                                  <Heart className="h-4 w-4" />
                                  <span className="text-sm">{message.likes || 0}</span>
                                </button>
                                <button className="flex items-center gap-2 hover:text-[#5865f2] transition-colors">
                                  <MessageCircle className="h-4 w-4" />
                                  <span className="text-sm">{message.replies || 0}</span>
                                </button>
                                <button className="flex items-center gap-2 hover:text-[#3ba55c] transition-colors">
                                  <Share className="h-4 w-4" />
                                  <span className="text-sm">Share</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Community Stats */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card className="bg-[#2f3136] border-[#40444b] p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#dcddde]">
                    <Users className="h-5 w-5 text-[#5865f2]" />
                    Community Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-[#b9bbbe]">Total Users</span>
                      <span className="font-semibold text-[#dcddde]">{stats.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b9bbbe]">Messages Today</span>
                      <span className="font-semibold text-[#dcddde]">{stats.messagesToday.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b9bbbe]">Total Messages</span>
                      <span className="font-semibold text-[#dcddde]">{stats.totalMessages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b9bbbe]">Active Channels</span>
                      <span className="font-semibold text-[#dcddde]">{stats.totalChannels}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#b9bbbe]">Online Now</span>
                      <span className="font-semibold text-[#3ba55c]">{onlineUsers.length}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Top Channels */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <Card className="bg-[#2f3136] border-[#40444b] p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#dcddde]">
                    <TrendingUp className="h-5 w-5 text-[#5865f2]" />
                    Popular Channels
                  </h3>
                  <div className="space-y-3">
                    {topChannels.length === 0 ? (
                      <p className="text-[#72767d] text-sm">No channels available yet.</p>
                    ) : (
                      topChannels.map((channel, index) => (
                        <motion.div
                          key={channel.id}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-[#40444b] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-[#72767d]" />
                            <div>
                              <p className="font-medium text-[#dcddde]">{channel.name}</p>
                              <p className="text-sm text-[#72767d]">{channel.message_count} messages</p>
                            </div>
                          </div>
                          <Badge className="bg-[#3ba55c]/20 text-[#3ba55c] border-[#3ba55c]/30">Active</Badge>
                        </motion.div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Online Users */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                <Card className="bg-[#2f3136] border-[#40444b] p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#dcddde]">
                    <Users className="h-5 w-5 text-[#5865f2]" />
                    Online Users ({onlineUsers.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {onlineUsers.length === 0 ? (
                      <p className="text-[#72767d] text-sm">No users online right now.</p>
                    ) : (
                      onlineUsers.slice(0, 10).map((user, index) => (
                        <motion.div
                          key={user.id}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#40444b] transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#3ba55c] rounded-full border-2 border-[#2f3136]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#dcddde] truncate">{user.name}</p>
                            <p className="text-xs text-[#72767d]">Online</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <Card className="bg-[#2f3136] border-[#40444b] p-6">
                  <h3 className="text-lg font-semibold mb-4 text-[#dcddde]">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button className="w-full bg-[#5865f2] hover:bg-[#4752c4]" onClick={onNavigateBack}>
                      Start Chatting
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#40444b] text-[#b9bbbe] hover:bg-[#40444b] bg-transparent"
                      onClick={onNavigateBack}
                    >
                      Join Discussion
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-[#40444b] text-[#b9bbbe] hover:bg-[#40444b] bg-transparent"
                    >
                      Find Friends
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

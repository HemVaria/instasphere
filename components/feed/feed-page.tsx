"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, ThumbsUp, MessageCircle, Share, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreatePostModal } from "./create-post-modal"
import { usePosts } from "@/hooks/use-posts"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface FeedPageProps {
  onNavigateBack: () => void
}

export function FeedPage({ onNavigateBack }: FeedPageProps) {
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({})
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({})

  const {
    posts,
    comments,
    createPost,
    deletePost,
    likePost,
    sharePost,
    addComment,
    deleteComment,
    likeComment,
    loadComments,
    loading,
    error,
    postsEnabled,
  } = usePosts()
  const { user } = useAuth()

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
      if (!comments[postId]) {
        loadComments(postId)
      }
    }
    setExpandedPosts(newExpanded)
  }

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return
    try {
      await addComment(postId, content)
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
    } catch (error: any) {
      console.error("Failed to add comment:", error)
    }
  }

  const handleAddReply = async (postId: string, parentId: string) => {
    const content = replyInputs[parentId]?.trim()
    if (!content) return
    try {
      await addComment(postId, content, parentId)
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }))
    } catch (error: any) {
      console.error("Failed to add reply:", error)
    }
  }

  const handleShare = async (postId: string) => {
    try {
      await sharePost(postId)
    } catch (error: any) {
      console.error("Failed to share post:", error)
    }
  }

  const formatTime = (timestamp: string) => formatDistanceToNow(new Date(timestamp), { addSuffix: true })

  if (!postsEnabled && posts.length === 0) {
    return (
      <div className="min-h-screen bg-[#36393f] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-[#dcddde]">Feed not set up</h2>
          <p className="text-[#72767d]">
            The database migration for posts hasn't been run yet. Ask an admin to execute
            <code className="mx-1 bg-[#2f3136] px-1 py-0.5 rounded border border-[#40444b] text-[#dcddde] text-sm">
              scripts/03-create-posts-schema.sql
            </code>
            and
            <code className="mx-1 bg-[#2f3136] px-1 py-0.5 rounded border border-[#40444b] text-[#dcddde] text-sm">
              scripts/05-add-post-image.sql
            </code>
            then refresh the page.
          </p>
          <Button onClick={onNavigateBack} className="bg-[#5865f2] hover:bg-[#4752c4]">
            Back to Chat
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#36393f] text-white">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 sm:p-6 border-b border-[#40444b] bg-[#2f3136]/90 backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#dcddde]">Feed</h1>
              <p className="text-sm text-[#72767d]">Share and discover posts from the community</p>
            </div>
          </div>

          <Button onClick={() => setShowCreatePost(true)} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {!postsEnabled && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-sm font-semibold text-yellow-400">Demo Mode</h3>
                <p className="text-xs text-yellow-300/80">
                  You're viewing demo posts. Run the database migration to enable full functionality.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-[#ed4245]/10 border border-[#ed4245]/20 rounded-lg">
            <p className="text-[#ed4245]">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#2f3136] rounded-lg border border-[#40444b] overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={post.avatar_url || "/placeholder.svg?height=40&width=40&query=user-avatar"} />
                      <AvatarFallback className="bg-[#5865f2] text-white">{post.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#dcddde]">{post.user_name}</span>
                        <span className="text-sm text-[#72767d]">{formatTime(post.created_at)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#dcddde] mb-2 break-words">{post.title}</h3>
                      {post.content && (
                        <p className="text-[#b9bbbe] whitespace-pre-wrap break-words mb-3">{post.content}</p>
                      )}

                      {/* Post Image */}
                      {post.image_url && (
                        <div className="rounded-lg overflow-hidden border border-[#40444b] bg-[#1f2124]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.image_url || "/placeholder.svg"}
                            alt="Post image"
                            className="w-full max-h-[480px] object-contain bg-[#1f2124]"
                          />
                        </div>
                      )}
                    </div>
                    {(post.user_id === user?.id || user?.user_metadata?.role === "admin") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePost(post.id)}
                        className="text-[#72767d] hover:text-[#ed4245] hover:bg-[#40444b]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-[#72767d] border-t border-[#40444b] pt-3">
                    <button
                      onClick={() => likePost(post.id)}
                      className={cn(
                        "flex items-center gap-2 hover:text-[#ed4245] transition-colors",
                        post.user_liked && "text-[#ed4245]",
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button
                      onClick={() => togglePostExpansion(post.id)}
                      className="flex items-center gap-2 hover:text-[#5865f2] transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center gap-2 hover:text-[#3ba55c] transition-colors"
                    >
                      <Share className="h-4 w-4" />
                      <span className="text-sm">{post.shares}</span>
                    </button>
                    <button
                      onClick={() => togglePostExpansion(post.id)}
                      className="ml-auto flex items-center gap-1 hover:text-[#dcddde] transition-colors"
                    >
                      {expandedPosts.has(post.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span className="text-sm">Hide</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span className="text-sm">Show</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comments Section (unchanged) */}
                <AnimatePresence>
                  {expandedPosts.has(post.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#40444b] bg-[#36393f]"
                    >
                      <div className="p-4 border-b border-[#40444b]">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage
                              src={
                                user?.user_metadata?.avatar_url ||
                                "/placeholder.svg?height=32&width=32&query=current-user-avatar"
                              }
                            />
                            <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a comment..."
                              className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2]"
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  handleAddComment(post.id)
                                }
                              }}
                            />
                            <Button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              size="icon"
                              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="space-y-3">
                            <div className="flex gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage
                                  src={
                                    comment.avatar_url ||
                                    "/placeholder.svg?height=32&width=32&query=comment-user-avatar"
                                  }
                                />
                                <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                  {comment.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="bg-[#40444b] rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-[#dcddde]">{comment.user_name}</span>
                                    <span className="text-xs text-[#72767d]">{formatTime(comment.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-[#b9bbbe] whitespace-pre-wrap break-words">
                                    {comment.content}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-[#72767d]">
                                  <button
                                    onClick={() => likeComment(comment.id)}
                                    className={cn(
                                      "flex items-center gap-1 hover:text-[#ed4245] transition-colors",
                                      (comment as any).user_liked && "text-[#ed4245]",
                                    )}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                    <span>{comment.likes}</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      setShowReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))
                                    }
                                    className="hover:text-[#dcddde] transition-colors"
                                  >
                                    Reply
                                  </button>
                                  {(comment.user_id === user?.id || user?.user_metadata?.role === "admin") && (
                                    <button
                                      onClick={() => deleteComment(comment.id)}
                                      className="hover:text-[#ed4245] transition-colors"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>

                                {showReplies[comment.id] && (
                                  <div className="flex gap-2 mt-3 ml-4">
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarImage
                                        src={
                                          user?.user_metadata?.avatar_url ||
                                          "/placeholder.svg?height=24&width=24&query=current-user-avatar"
                                        }
                                      />
                                      <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                        {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 flex gap-2">
                                      <Input
                                        value={replyInputs[comment.id] || ""}
                                        onChange={(e) =>
                                          setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))
                                        }
                                        placeholder="Write a reply..."
                                        className="bg-[#40444b] border-[#40444b] text-[#dcddde] placeholder:text-[#72767d] focus:border-[#5865f2] text-sm"
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleAddReply(post.id, comment.id)
                                          }
                                        }}
                                      />
                                      <Button
                                        onClick={() => handleAddReply(post.id, comment.id)}
                                        disabled={!replyInputs[comment.id]?.trim()}
                                        size="sm"
                                        className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                                      >
                                        <Send className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="ml-6 mt-3 space-y-3 border-l-2 border-[#40444b] pl-4">
                                    {comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-3">
                                        <Avatar className="h-6 w-6 flex-shrink-0">
                                          <AvatarImage
                                            src={
                                              reply.avatar_url ||
                                              "/placeholder.svg?height=24&width=24&query=reply-user-avatar"
                                            }
                                          />
                                          <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                                            {reply.user_name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-[#40444b] rounded-lg p-2">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-semibold text-[#dcddde]">
                                                {reply.user_name}
                                              </span>
                                              <span className="text-xs text-[#72767d]">
                                                {formatTime(reply.created_at)}
                                              </span>
                                            </div>
                                            <p className="text-xs text-[#b9bbbe] whitespace-pre-wrap break-words">
                                              {reply.content}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-4 mt-1 text-xs text-[#72767d]">
                                            <button
                                              onClick={() => likeComment(reply.id)}
                                              className={cn(
                                                "flex items-center gap-1 hover:text-[#ed4245] transition-colors",
                                                (reply as any).user_liked && "text-[#ed4245]",
                                              )}
                                            >
                                              <ThumbsUp className="h-3 w-3" />
                                              <span>{reply.likes}</span>
                                            </button>
                                            {(reply.user_id === user?.id || user?.user_metadata?.role === "admin") && (
                                              <button
                                                onClick={() => deleteComment(reply.id)}
                                                className="hover:text-[#ed4245] transition-colors"
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {posts.length === 0 && !loading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-[#dcddde] mb-2">No posts yet</h3>
              <p className="text-[#72767d] mb-4">Be the first to share something with the community!</p>
              <Button onClick={() => setShowCreatePost(true)} className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </div>
  )
}

"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"

interface Post {
  id: string
  title: string
  content?: string | null
  user_id: string
  user_name: string
  avatar_url?: string | null
  likes: number
  comments_count: number
  shares: number
  created_at: string
  updated_at: string
  user_liked?: boolean
  image_url?: string | null
}

interface PostComment {
  id: string
  post_id: string
  parent_id?: string | null
  content: string
  user_id: string
  user_name: string
  avatar_url?: string | null
  likes: number
  created_at: string
  updated_at: string
  user_liked?: boolean
  replies?: PostComment[]
}

interface PostsContextType {
  posts: Post[]
  comments: { [postId: string]: PostComment[] }
  createPost: (title: string, content?: string, imageUrl?: string | null) => Promise<void>
  deletePost: (postId: string) => Promise<void>
  likePost: (postId: string) => Promise<void>
  sharePost: (postId: string) => Promise<void>
  addComment: (postId: string, content: string, parentId?: string) => Promise<void>
  deleteComment: (commentId: string) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  loadComments: (postId: string) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
  postsEnabled: boolean
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

const getDemoPosts = (): Post[] => [
  {
    id: "demo-1",
    title: "Welcome to Instasphere Feed! 🎉",
    content:
      "This is a demo post showing how the feed works. You can like, comment, and share posts here!\n\nTo enable full functionality, run the database migration script and refresh the page.",
    user_id: "demo-user-1",
    user_name: "Instasphere Team",
    avatar_url: "/instasphere-team-avatar.png",
    likes: 12,
    comments_count: 3,
    shares: 2,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user_liked: false,
    image_url: null,
  },
  {
    id: "demo-2",
    title: "Tips for Great Online Communication 💬",
    content:
      "Here are some essential tips for effective online communication:\n\n• Be respectful and kind to everyone\n• Listen actively and ask clarifying questions\n• Share your experiences and insights\n• Use emojis to convey tone 😊\n• Keep discussions constructive\n\nWhat other tips would you add to this list?",
    user_id: "demo-user-2",
    user_name: "Community Manager",
    avatar_url: "/community-manager-avatar.png",
    likes: 24,
    comments_count: 8,
    shares: 5,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user_liked: true,
    image_url: null,
  },
  {
    id: "demo-3",
    title: "New Features Coming Soon! 🚀",
    content:
      "We're excited to announce some amazing new features coming to Instasphere:\n\n🎨 Custom themes and dark mode\n📱 Mobile app improvements\n🔔 Enhanced notifications\n🔍 Better search functionality\n👥 User profiles and badges\n\nStay tuned for updates!",
    user_id: "demo-user-3",
    user_name: "Product Team",
    avatar_url: "/product-team-avatar.png",
    likes: 18,
    comments_count: 5,
    shares: 7,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user_liked: false,
    image_url: null,
  },
  {
    id: "demo-4",
    title: "Share Your Favorite Tech Stack! 💻",
    content:
      "What's your go-to technology stack for building web applications?\n\nMine is:\n• Frontend: React + TypeScript\n• Backend: Node.js + Express\n• Database: PostgreSQL\n• Hosting: Vercel + Supabase\n\nDrop your stack in the comments below! 👇",
    user_id: "demo-user-4",
    user_name: "Developer",
    avatar_url: "/developer-avatar.png",
    likes: 31,
    comments_count: 12,
    shares: 4,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user_liked: true,
    image_url: null,
  },
]

export function PostsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [postsEnabled, setPostsEnabled] = useState(true)
  const [comments, setComments] = useState<{ [postId: string]: PostComment[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!user || !postsEnabled) {
      setLoading(false)
      return
    }

    let mounted = true
    let postsChannel: any
    let commentsChannel: any

    const initializePosts = async () => {
      try {
        await loadPosts()

        const supabase = createClient()
        postsChannel = supabase
          .channel("posts")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "posts",
            },
            () => {
              if (!mounted) return
              loadPosts()
            },
          )
          .subscribe()

        commentsChannel = supabase
          .channel("post_comments")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "post_comments",
            },
            (payload) => {
              if (!mounted) return
              if (payload.new?.post_id) {
                loadComments(payload.new.post_id as string)
              }
            },
          )
          .subscribe()
      } catch (err: any) {
        if (mounted) {
          console.error("Failed to initialize posts:", err)
          setError(`Failed to connect to posts: ${err.message}`)
          setLoading(false)
        }
      }
    }

    initializePosts()

    return () => {
      mounted = false
      postsChannel?.unsubscribe()
      commentsChannel?.unsubscribe()
    }
  }, [user, postsEnabled])

  const loadPosts = async () => {
    try {
      setError(null)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          console.warn("Posts table not found – using demo data")
          setPostsEnabled(false)
          setPosts(getDemoPosts())
          return
        }
        console.error("Error loading posts:", error)
        setError(`Failed to load posts: ${error.message}`)
        return
      }

      setPostsEnabled(true)

      let postsWithLikes = data || []
      if (user && data?.length) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in(
            "post_id",
            data.map((p: any) => p.id),
          )

        const likedPostIds = new Set((likes || []).map((l: any) => l.post_id))
        postsWithLikes = data.map((post: any) => ({
          ...post,
          user_liked: likedPostIds.has(post.id),
        }))
      }

      setPosts(postsWithLikes)
    } catch (err: any) {
      console.error("Network error loading posts:", err)
      setError(`Network error: ${err.message}`)
      setPosts(getDemoPosts())
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (postId: string) => {
    if (!postsEnabled) return
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading comments:", error)
        return
      }

      let commentsWithLikes = data || []
      if (user && data?.length) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in(
            "comment_id",
            data.map((c: any) => c.id),
          )

        const likedCommentIds = new Set((likes || []).map((l: any) => l.comment_id))
        commentsWithLikes = data.map((comment: any) => ({
          ...comment,
          user_liked: likedCommentIds.has(comment.id),
        }))
      }

      const topLevel = commentsWithLikes.filter((c: any) => !c.parent_id)
      const repliesMap = commentsWithLikes
        .filter((c: any) => c.parent_id)
        .reduce((acc: Record<string, PostComment[]>, reply: any) => {
          if (!acc[reply.parent_id]) acc[reply.parent_id] = []
          acc[reply.parent_id].push(reply)
          return acc
        }, {})

      const organized = topLevel.map((c: any) => ({
        ...c,
        replies: repliesMap[c.id] || [],
      }))

      setComments((prev) => ({ ...prev, [postId]: organized }))
    } catch (err: any) {
      console.error("Error loading comments:", err)
    }
  }

  const createPost = async (title: string, content?: string, imageUrl?: string | null) => {
    if (!user) throw new Error("You must be logged in to create posts")

    if (!postsEnabled) {
      // Demo mode: persist in-memory, allow data URLs or uploaded URLs
      const newPost: Post = {
        id: `demo-${Date.now()}`,
        title: title.trim(),
        content: content?.trim() || null,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url,
        likes: 0,
        comments_count: 0,
        shares: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_liked: false,
        image_url: imageUrl || null,
      }
      setPosts((prev) => [newPost, ...prev])
      return
    }

    try {
      setError(null)
      const supabase = createClient()

      const postData: any = {
        title: title.trim(),
        content: content?.trim() || null,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url,
        likes: 0,
        comments_count: 0,
        shares: 0,
        image_url: imageUrl || null,
      }

      let insertError: any | null = null
      let result = await supabase.from("posts").insert(postData)

      if (result.error) {
        insertError = result.error
        // If the image_url column doesn't exist (migration not run), retry without it
        if (insertError.code === "42703" || String(insertError.message || "").includes("column")) {
          delete postData.image_url
          result = await supabase.from("posts").insert(postData)
        }
      }

      if (result.error) {
        console.error("Error creating post:", result.error)
        throw new Error(`Failed to create post: ${result.error.message}`)
      }
    } catch (err: any) {
      console.error("Error creating post:", err)
      throw err
    }
  }

  const deletePost = async (postId: string) => {
    if (!postsEnabled) return
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      const post = posts.find((p) => p.id === postId)
      if (!post || (post.user_id !== user.id && user.user_metadata?.role !== "admin")) {
        throw new Error("You can only delete your own posts")
      }

      const { error } = await supabase.from("posts").delete().eq("id", postId)

      if (error) {
        console.error("Error deleting post:", error)
        throw new Error(`Failed to delete post: ${error.message}`)
      }
    } catch (err: any) {
      console.error("Error deleting post:", err)
      throw err
    }
  }

  const likePost = async (postId: string) => {
    if (!user) return

    if (!postsEnabled) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.user_liked ? Math.max(0, post.likes - 1) : post.likes + 1,
                user_liked: !post.user_liked,
              }
            : post,
        ),
      )
      return
    }

    try {
      setError(null)
      const supabase = createClient()

      const post = posts.find((p) => p.id === postId)
      if (!post) return

      if (post.user_liked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)
        await supabase
          .from("posts")
          .update({ likes: Math.max(0, post.likes - 1) })
          .eq("id", postId)
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id })
        await supabase
          .from("posts")
          .update({ likes: post.likes + 1 })
          .eq("id", postId)
      }
    } catch (err: any) {
      console.error("Error toggling post like:", err)
      throw err
    }
  }

  const sharePost = async (postId: string) => {
    if (!postsEnabled) return
    try {
      setError(null)
      const supabase = createClient()

      const post = posts.find((p) => p.id === postId)
      if (!post) return

      await supabase
        .from("posts")
        .update({ shares: post.shares + 1 })
        .eq("id", postId)
    } catch (err: any) {
      console.error("Error sharing post:", err)
      throw err
    }
  }

  const addComment = async (postId: string, content: string, parentId?: string) => {
    if (!postsEnabled) throw new Error("Posts feature disabled")
    if (!user) throw new Error("You must be logged in to comment")

    try {
      setError(null)
      const supabase = createClient()

      const commentData = {
        post_id: postId,
        parent_id: parentId || null,
        content: content.trim(),
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Anonymous",
        avatar_url: user.user_metadata?.avatar_url,
        likes: 0,
      }

      const { error } = await supabase.from("post_comments").insert(commentData)

      if (error) {
        console.error("Error adding comment:", error)
        throw new Error(`Failed to add comment: ${error.message}`)
      }

      await loadComments(postId)
    } catch (err: any) {
      console.error("Error adding comment:", err)
      throw err
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!postsEnabled) return
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      const { error } = await supabase.from("post_comments").delete().eq("id", commentId)

      if (error) {
        console.error("Error deleting comment:", error)
        throw new Error(`Failed to delete comment: ${error.message}`)
      }
    } catch (err: any) {
      console.error("Error deleting comment:", err)
      throw err
    }
  }

  const likeComment = async (commentId: string) => {
    if (!postsEnabled) return
    if (!user) return

    try {
      setError(null)
      const supabase = createClient()

      // Find comment and its post
      let target: PostComment | undefined
      let postId: string | undefined
      for (const [pid, list] of Object.entries(comments)) {
        const c =
          list.find((x) => x.id === commentId) ||
          list.find((x) => x.replies?.some((r) => r.id === commentId))?.replies?.find((r) => r.id === commentId)
        if (c) {
          target = c
          postId = pid
          break
        }
      }
      if (!target || !postId) return

      if ((target as any).user_liked) {
        await supabase.from("post_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)
        await supabase
          .from("post_comments")
          .update({ likes: Math.max(0, target.likes - 1) })
          .eq("id", commentId)
      } else {
        await supabase.from("post_likes").insert({ comment_id: commentId, user_id: user.id })
        await supabase
          .from("post_comments")
          .update({ likes: target.likes + 1 })
          .eq("id", commentId)
      }

      await loadComments(postId)
    } catch (err: any) {
      console.error("Error toggling comment like:", err)
      throw err
    }
  }

  return (
    <PostsContext.Provider
      value={{
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
        clearError,
        postsEnabled,
      }}
    >
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostsContext)
  if (context === undefined) {
    throw new Error("usePosts must be used within a PostsProvider")
  }
  return context
}

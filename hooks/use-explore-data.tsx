"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

interface ExploreUser {
  id: string
  name: string
  email: string
  avatar_url?: string
  is_online: boolean
  last_seen?: string
  joined_at: string
  is_verified: boolean
  verification_level: string
}

interface ExplorePost {
  id: string
  title: string
  content: string
  author_id: string
  author_name: string
  author_avatar?: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  image_url?: string
  is_verified_author: boolean
}

interface ExploreDataContextType {
  users: ExploreUser[]
  posts: ExplorePost[]
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const ExploreDataContext = createContext<ExploreDataContextType | undefined>(undefined)

export function ExploreDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ExploreUser[]>([])
  const [posts, setPosts] = useState<ExplorePost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()

      // Load verified users with their presence status
      const { data: usersData, error: usersError } = await supabase
        .from("user_presence")
        .select(`
          user_id,
          name,
          email,
          avatar_url,
          is_online,
          last_seen,
          joined_at,
          user_verification!inner(
            is_verified,
            verification_level
          )
        `)
        .eq("user_verification.is_verified", true)
        .order("joined_at", { ascending: false })
        .limit(50)

      if (usersError) {
        console.error("Error loading explore users:", {
          message: usersError.message,
          details: (usersError as any).details,
          hint: (usersError as any).hint,
          code: (usersError as any).code,
        })
        setError(usersError.message || "Failed to load users")
      } else {
        const exploreUsers: ExploreUser[] = (usersData || [])
          .filter((userData) => userData.user_verification && userData.user_verification.is_verified)
          .map((userData) => ({
            id: userData.user_id,
            name: userData.name || userData.email?.split("@")[0] || "Anonymous",
            email: userData.email || "",
            avatar_url: userData.avatar_url,
            is_online: userData.is_online,
            last_seen: userData.last_seen,
            joined_at: userData.joined_at,
            is_verified: userData.user_verification.is_verified,
            verification_level: userData.user_verification.verification_level,
          }))
        setUsers(exploreUsers)
      }

      // Load posts from verified users
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          author_id,
          author_name,
          author_avatar,
          created_at,
          updated_at,
          likes_count,
          comments_count,
          image_url,
          user_verification!inner(
            is_verified
          )
        `)
        .eq("user_verification.is_verified", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (postsError) {
        console.error("Error loading explore posts:", {
          message: postsError.message,
          details: (postsError as any).details,
          hint: (postsError as any).hint,
          code: (postsError as any).code,
        })
        setError(postsError.message || "Failed to load posts")
      } else {
        const explorePosts: ExplorePost[] = (postsData || [])
          .filter((postData) => postData.user_verification && postData.user_verification.is_verified)
          .map((postData) => ({
            id: postData.id,
            title: postData.title || "",
            content: postData.content,
            author_id: postData.author_id,
            author_name: postData.author_name,
            author_avatar: postData.author_avatar,
            created_at: postData.created_at,
            updated_at: postData.updated_at,
            likes_count: postData.likes_count || 0,
            comments_count: postData.comments_count || 0,
            image_url: postData.image_url,
            is_verified_author: postData.user_verification.is_verified,
          }))
        setPosts(explorePosts)
      }
    } catch (err: any) {
      console.error("Error refreshing explore data:", err)
      setError("Failed to load explore data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <ExploreDataContext.Provider
      value={{
        users,
        posts,
        loading,
        error,
        refreshData,
      }}
    >
      {children}
    </ExploreDataContext.Provider>
  )
}

export function useExploreData() {
  const context = useContext(ExploreDataContext)
  if (context === undefined) {
    throw new Error("useExploreData must be used within an ExploreDataProvider")
  }
  return context
}

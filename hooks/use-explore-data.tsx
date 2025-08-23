"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface ExploreUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: string;
  joined_at: string;
  is_verified: boolean;
  verification_level: string;
}

interface ExplorePost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  image_url?: string;
  is_verified_author: boolean;
}

interface ExploreDataContextType {
  users: ExploreUser[];
  posts: ExplorePost[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const ExploreDataContext = createContext<ExploreDataContextType | undefined>(undefined);

export function ExploreDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ExploreUser[]>([]);
  const [posts, setPosts] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // First check if the user_verification table exists
      const { error: checkError } = await supabase
        .from('user_verification')
        .select('user_id')
        .limit(1);
      
      // If table doesn't exist, set empty users array
      if (checkError && checkError.message.includes("does not exist")) {
        setUsers([]);
      } else {
        // Get verified users
        const { data: usersData, error: usersError } = await supabase
          .from("user_verification")
          .select(`
            user_id,
            is_verified,
            verification_level,
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
          .eq("is_verified", true)
          .order("user_id", { ascending: false })
          .limit(50);

        if (usersError) {
          console.error("Error loading explore users:", usersError);
          setUsers([]);
        } else {
          const exploreUsers: ExploreUser[] = (usersData || []).filter(userData => userData.user_presence).map((userData) => ({
            id: userData.user_id,
            name: userData.user_presence?.name || userData.user_presence?.email?.split("@")[0] || "Anonymous",
            email: userData.user_presence?.email || "",
            avatar_url: userData.user_presence?.avatar_url,
            is_online: userData.user_presence?.is_online || false,
            last_seen: userData.user_presence?.last_seen,
            joined_at: userData.user_presence?.joined_at,
            is_verified: userData.is_verified,
            verification_level: userData.verification_level,
          }));
          setUsers(exploreUsers);
        }
      }

      // Check if the posts table exists
      const { error: checkPostsError } = await supabase
        .from('posts')
        .select('id')
        .limit(1);
      
      // If table doesn't exist, set empty posts array
      if (checkPostsError && checkPostsError.message.includes("does not exist")) {
        setPosts([]);
      } else {
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
          .limit(20);

        if (postsError) {
          console.error("Error loading explore posts:", postsError);
          setPosts([]);
        } else {
          const explorePosts: ExplorePost[] = (postsData || []).map((postData) => ({
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
          }));
          setPosts(explorePosts);
        }
      }
    } catch (err: any) {
      console.error("Error refreshing explore data:", err);
      setError("Failed to load explore data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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
  );
}

export function useExploreData() {
  const context = useContext(ExploreDataContext);
  if (context === undefined) {
    throw new Error("useExploreData must be used within an ExploreDataProvider");
  }
  
  // Add default values for the data used in ExplorePage
  return {
    ...context,
    recentMessages: [],
    topChannels: [],
    onlineUsers: [],
    stats: {
      totalUsers: 0,
      messagesToday: 0,
      totalMessages: 0,
      totalChannels: 0
    }
  };
}

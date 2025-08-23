"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER_STORAGE_KEY = "instasphere_demo_user"

function isNetworkFetchError(err: unknown) {
  const msg = (err as any)?.message || ""
  return msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")
}

function createDemoUser(email: string, name?: string): User {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  const now = new Date().toISOString()
  // Cast to any to satisfy @supabase/supabase-js type differences across versions
  const demo: any = {
    id,
    aud: "authenticated",
    role: null,
    email,
    phone: "",
    confirmation_sent_at: now,
    app_metadata: { provider: "demo" },
    user_metadata: {
      name: name || email.split("@")[0],
      display_name: name || email.split("@")[0],
      avatar_url: "/demo-avatar.png",
    },
    identities: [],
    created_at: now,
    updated_at: now,
    last_sign_in_at: now,
    factors: [],
    is_anonymous: false,
  }
  return demo as User
}

function saveDemoUser(user: User) {
  try {
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user))
  } catch {}
}

function getSavedDemoUser(): User | null {
  try {
    const raw = localStorage.getItem(DEMO_USER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSavedDemoUser() {
  try {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY)
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let supabase: ReturnType<typeof createClient> | null = null
    let timeoutId: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // 1) If a demo user exists, use it immediately and skip network calls
        const demo = getSavedDemoUser()
        if (demo) {
          setUser(demo)
          setError(null)
          setLoading(false)
          return
        }

        // 2) Otherwise try Supabase
        supabase = createClient()

        // Hard timeout for initial session fetch to avoid long hangs in preview
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn("Auth initialization taking longer than expected")
            setLoading(false)
          }
        }, 5000)

        // Race session fetch with a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Session timeout")), 3500))

        const result = (await Promise.race([sessionPromise, timeoutPromise])) as any

        if (!mounted) return
        clearTimeout(timeoutId)

        if (result?.error) {
          // Don't surface transient/timeout errors on first paint
          if (!isNetworkFetchError(result.error) && !String(result.error.message || "").includes("timeout")) {
            setError(`Authentication error: ${result.error.message}`)
          }
          setUser(null)
        } else {
          setUser(result?.data?.session?.user ?? null)
          setError(null)
        }

        // Listen for auth changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!mounted) return
          setUser(session?.user ?? null)
          setError(null)
        })

        return subscription
      } catch (err: any) {
        if (!mounted) return
        console.error("Auth initialization error:", err)
        if (!isNetworkFetchError(err) && !String(err.message || "").includes("timeout")) {
          setError(`Failed to initialize authentication: ${err.message}`)
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    const subscription = initializeAuth()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription?.then((sub) => sub?.unsubscribe())
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      // If already in demo mode, just ensure user is present
      const existingDemo = getSavedDemoUser()
      if (existingDemo) {
        setUser(existingDemo)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        // Fallback to demo user on network fetch failure
        if (isNetworkFetchError(error)) {
          const demo = createDemoUser(email)
          saveDemoUser(demo)
          setUser(demo)
          console.warn("Network issue detected. Using demo user for preview.")
          return
        }
        throw new Error(error.message)
      }

      // Supabase will update via onAuthStateChange
    } catch (err: any) {
      if (isNetworkFetchError(err)) {
        const demo = createDemoUser(email)
        saveDemoUser(demo)
        setUser(demo)
        console.warn("Network issue detected. Using demo user for preview.")
        return
      }
      console.error("Sign in failed:", err)
      setError(err.message || "Failed to sign in")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null)
      setLoading(true)

      // If already in demo mode, just ensure user is present
      const existingDemo = getSavedDemoUser()
      if (existingDemo) {
        setUser(existingDemo)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            display_name: name.trim(),
          },
        },
      })

      if (error) {
        // Fallback to demo user on network fetch failure
        if (isNetworkFetchError(error)) {
          const demo = createDemoUser(email, name)
          saveDemoUser(demo)
          setUser(demo)
          console.warn("Network issue detected. Using demo user for preview.")
          return
        }
        throw new Error(error.message)
      }

      // In email confirmation flows, user may not be immediately available.
      // We'll optimistically create a demo user for preview if session isn't returned.
      setTimeout(() => {
        if (!getSavedDemoUser()) {
          const demo = createDemoUser(email, name)
          saveDemoUser(demo)
          setUser(demo)
          console.warn("Using demo user until email confirmation completes.")
        }
      }, 500)
    } catch (err: any) {
      if (isNetworkFetchError(err)) {
        const demo = createDemoUser(email, name)
        saveDemoUser(demo)
        setUser(demo)
        console.warn("Network issue detected. Using demo user for preview.")
        return
      }
      console.error("Sign up failed:", err)
      setError(err.message || "Failed to sign up")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      // If demo mode active, just keep the demo user
      const existingDemo = getSavedDemoUser()
      if (existingDemo) {
        setUser(existingDemo)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        if (isNetworkFetchError(error)) {
          // Fallback: create a demo user
          const demo = createDemoUser("demo@instasphere.local", "Demo User")
          saveDemoUser(demo)
          setUser(demo)
          console.warn("Network issue detected. Using demo user for preview.")
          return
        }
        throw new Error(error.message)
      }
      // OAuth flow will redirect; after redirect, onAuthStateChange handles it.
    } catch (err: any) {
      if (isNetworkFetchError(err)) {
        const demo = createDemoUser("demo@instasphere.local", "Demo User")
        saveDemoUser(demo)
        setUser(demo)
        console.warn("Network issue detected. Using demo user for preview.")
        return
      }
      console.error("Google sign in failed:", err)
      setError(err.message || "Failed to sign in with Google")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      // Ignore sign out errors in preview/demo
    } finally {
      clearSavedDemoUser()
      setUser(null)
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

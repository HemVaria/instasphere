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
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  isPasswordRecovery: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isNetworkFetchError(err: unknown) {
  const msg = (err as any)?.message || ""
  return msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let mounted = true
    let supabase: ReturnType<typeof createClient> | null = null
    let timeoutId: NodeJS.Timeout

    const initializeAuth = async () => {
      try {
        // Initialize Supabase and check existing session
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
        } = supabase.auth.onAuthStateChange((event: string, session: any) => {
          if (!mounted) return
          setUser(session?.user ?? null)
          setError(null)

          if (event === "PASSWORD_RECOVERY") {
            setIsPasswordRecovery(true)
          } else if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            setIsPasswordRecovery(false)
          }
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

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw new Error(error.message)

      if (data.session) {
        setUser(data.session.user)
      }
    } catch (err: any) {
      if (isNetworkFetchError(err)) throw err
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

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined,
          data: {
            name: name.trim(),
            display_name: name.trim(),
          },
        },
      })

      if (error) throw new Error(error.message)

      if (data.session) {
        setUser(data.session.user)
      } else {
        // Ensure no session is set until email is confirmed
        setUser(null)
      }
    } catch (err: any) {
      if (isNetworkFetchError(err)) throw err
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

      if (error) throw new Error(error.message)
      // OAuth flow will redirect; after redirect, onAuthStateChange handles it.
    } catch (err: any) {
      if (isNetworkFetchError(err)) throw err
      console.error("Google sign in failed:", err)
      setError(err.message || "Failed to sign in with Google")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPasswordForEmail = async (email: string) => {
    try {
      setError(null)
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      })
      if (error) throw new Error(error.message)
    } catch (err: any) {
      if (isNetworkFetchError(err)) throw err
      console.error("Reset password failed:", err)
      setError(err.message || "Failed to send reset password email")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (password: string) => {
    try {
      setError(null)
      setLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new Error(error.message)
      setIsPasswordRecovery(false)
    } catch (err: any) {
      if (isNetworkFetchError(err)) throw err
      console.error("Update password failed:", err)
      setError(err.message || "Failed to update password")
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
        resetPasswordForEmail,
        updatePassword,
        signOut,
        clearError,
        isPasswordRecovery,
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

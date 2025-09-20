import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return existing client if already created
  if (supabaseClient) return supabaseClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if we're in development and log the environment variables
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Supabase Environment Check:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", url ? "✅ Set" : "❌ Missing")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", key ? "✅ Set" : "❌ Missing")
  }

  // Validate environment variables
  if (!url || !key) {
    console.error("❌ Supabase configuration missing")
    throw new Error("Missing required Supabase environment variables. Please check your .env.local file.")
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    console.error("❌ Invalid NEXT_PUBLIC_SUPABASE_URL format:", url)
    throw new Error("Invalid Supabase URL format")
  }

  try {
    supabaseClient = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    console.log("✅ Supabase client initialized successfully")
    return supabaseClient
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    throw error
  }
}

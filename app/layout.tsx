import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/theme-sundown.css"
import "../styles/sundown-fixes.css"
import "../styles/sundown-channels.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/use-auth"
import { ChatProvider } from "@/hooks/use-chat"
import { ChannelsProvider } from "@/hooks/use-channels"
import { DMsProvider } from "@/hooks/use-dms"
import { ExploreDataProvider } from "@/hooks/use-explore-data"
import { PostsProvider } from "@/hooks/use-posts"
import { NotificationsProvider } from "@/hooks/use-notifications"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Instasphere - Connect, Share, Explore",
  description: "A modern social platform for connecting with friends and sharing experiences",
  keywords: ["social media", "chat", "messaging", "community", "sharing"],
  authors: [{ name: "Instasphere Team" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="sundown">
      <body className={inter.className}>
        {/* Chatling embed */}
        <Script id="chatling-config" strategy="afterInteractive">
          {`window.chtlConfig = { chatbotId: "4768126643" }`}
        </Script>
        <Script id="chatling-script" strategy="afterInteractive" src="https://chatling.ai/js/embed.js" data-id="4768126643" async />
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <NotificationsProvider>
                <ExploreDataProvider>
                  <PostsProvider>
                    <ChatProvider>
                      <ChannelsProvider>
                        <DMsProvider>{children}</DMsProvider>
                      </ChannelsProvider>
                    </ChatProvider>
                  </PostsProvider>
                </ExploreDataProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

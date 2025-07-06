"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Moon, Sun, Monitor, User, Bell, Shield, Palette, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface SettingsPageProps {
  onNavigateBack: () => void
}

export function SettingsPage({ onNavigateBack }: SettingsPageProps) {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Light theme for daytime use",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Dark theme for nighttime use",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow your system preference",
    },
  ]

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut()
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-4 sm:p-6 border-b border-border bg-card/50 backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigateBack}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Profile</h2>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">
                      {user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Appearance Section */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Appearance</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Theme</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon
                        const isSelected = theme === option.value

                        return (
                          <button
                            key={option.value}
                            onClick={() => setTheme(option.value)}
                            className={cn(
                              "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50 hover:bg-accent/50",
                            )}
                          >
                            <div
                              className={cn(
                                "p-3 rounded-full",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{option.label}</p>
                              <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Notifications Section */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Notifications</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                    </div>
                    <Switch id="push-notifications" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="message-sounds" className="font-medium">
                        Message Sounds
                      </Label>
                      <p className="text-sm text-muted-foreground">Play sound when receiving messages</p>
                    </div>
                    <Switch id="message-sounds" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="desktop-notifications" className="font-medium">
                        Desktop Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Show notifications on desktop</p>
                    </div>
                    <Switch id="desktop-notifications" defaultChecked />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy & Security
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Account Actions */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account</h3>
                <div className="space-y-3">
                  <Button onClick={handleSignOut} variant="destructive" className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Signed in as <span className="font-medium">{user?.email}</span>
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* App Info */}
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Version:</span> 1.0.0
                  </p>
                  <p>
                    <span className="font-medium">Build:</span> 2024.01.15
                  </p>
                  <p>
                    <span className="font-medium">Platform:</span> Web
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Check for Updates
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

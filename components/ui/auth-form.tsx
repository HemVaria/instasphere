"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Eye, EyeOff, Loader2, MailCheck, X, Database, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

enum AuthView {
  SIGN_IN = "sign-in",
  SIGN_UP = "sign-up",
  FORGOT_PASSWORD = "forgot-password",
  RESET_SUCCESS = "reset-success",
}

interface AuthState {
  view: AuthView
}

interface FormState {
  isLoading: boolean
  error: string | null
  showPassword: boolean
}

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

type SignInFormValues = z.infer<typeof signInSchema>
type SignUpFormValues = z.infer<typeof signUpSchema>
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

interface AuthProps {
  onClose: () => void
}

function Auth({ onClose }: AuthProps) {
  const [state, setState] = React.useState<AuthState>({ view: AuthView.SIGN_IN })

  const setView = React.useCallback((view: AuthView) => {
    setState((prev) => ({ ...prev, view }))
  }, [])

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>

          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
          <div className="relative z-10 p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Database className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Setup Required</h2>
              <p className="text-muted-foreground mb-6">
                To enable authentication and chat features, you need to add Supabase integration to this project.
              </p>

              <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Missing Supabase Configuration
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Add Supabase integration to enable user authentication, real-time messaging, and data persistence.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => (window.location.href = "/api/setup-supabase")}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Add Supabase Integration
                </Button>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open("https://supabase.com/docs/guides/getting-started", "_blank")}
                >
                  View Setup Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {state.view === AuthView.SIGN_IN && (
              <AuthSignIn
                key="sign-in"
                onForgotPassword={() => setView(AuthView.FORGOT_PASSWORD)}
                onSignUp={() => setView(AuthView.SIGN_UP)}
              />
            )}
            {state.view === AuthView.SIGN_UP && <AuthSignUp key="sign-up" onSignIn={() => setView(AuthView.SIGN_IN)} />}
            {state.view === AuthView.FORGOT_PASSWORD && (
              <AuthForgotPassword
                key="forgot-password"
                onSignIn={() => setView(AuthView.SIGN_IN)}
                onSuccess={() => setView(AuthView.RESET_SUCCESS)}
              />
            )}
            {state.view === AuthView.RESET_SUCCESS && (
              <AuthResetSuccess key="reset-success" onSignIn={() => setView(AuthView.SIGN_IN)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="mb-6 animate-in rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
      {message}
    </div>
  )
}

function AuthSocialButtons({ isLoading }: { isLoading: boolean }) {
  const { signInWithGoogle } = useAuth()
  const [googleLoading, setGoogleLoading] = React.useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      await signInWithGoogle()
    } catch (error: any) {
      console.error("Google sign in failed:", error)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="w-full mt-6">
      <Button
        variant="outline"
        className="w-full h-12 bg-background/50 border-border/50"
        disabled={isLoading || googleLoading}
        onClick={handleGoogleSignIn}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
        )}
        {googleLoading ? "Signing in..." : "Continue with Google"}
      </Button>
    </div>
  )
}

function AuthSeparator({ text = "Or continue with" }: { text?: string }) {
  return (
    <div className="relative mt-6">
      <div className="absolute inset-0 flex items-center">
        <Separator />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  )
}

function AuthSignIn({
  onForgotPassword,
  onSignUp,
}: {
  onForgotPassword: () => void
  onSignUp: () => void
}) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  })

  const { signIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: SignInFormValues) => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await signIn(data.email, data.password)
    } catch (error: any) {
      setFormState((prev) => ({ ...prev, error: error.message || "Sign in failed" }))
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <AuthError message={formState.error} />

      {/* Google Sign In Button */}
      <AuthSocialButtons isLoading={formState.isLoading} />

      <AuthSeparator text="Or continue with email" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={onForgotPassword}
              disabled={formState.isLoading}
            >
              Forgot password?
            </Button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={formState.showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={formState.isLoading}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setFormState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
              disabled={formState.isLoading}
            >
              {formState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onSignUp} disabled={formState.isLoading}>
          Create one
        </Button>
      </p>
    </motion.div>
  )
}

function AuthSignUp({ onSignIn }: { onSignIn: () => void }) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  })

  const { signUp } = useAuth()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", terms: false },
  })

  const terms = watch("terms")

  const onSubmit = async (data: SignUpFormValues) => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await signUp(data.email, data.password, data.name)
    } catch (error: any) {
      setFormState((prev) => ({ ...prev, error: error.message || "Sign up failed" }))
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-8"
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Get started with your account</p>
      </div>

      <AuthError message={formState.error} />

      {/* Google Sign Up Button */}
      <AuthSocialButtons isLoading={formState.isLoading} />

      <AuthSeparator text="Or continue with email" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={formState.isLoading}
            className={cn(errors.name && "border-destructive")}
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={formState.showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={formState.isLoading}
              className={cn(errors.password && "border-destructive")}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setFormState((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
              disabled={formState.isLoading}
            >
              {formState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(checked) => setValue("terms", checked === true)}
            disabled={formState.isLoading}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="text-sm">
              I agree to the terms
            </Label>
            <p className="text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <Button variant="link" className="h-auto p-0 text-xs">
                Terms
              </Button>{" "}
              and{" "}
              <Button variant="link" className="h-auto p-0 text-xs">
                Privacy Policy
              </Button>
              .
            </p>
          </div>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Have an account?{" "}
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onSignIn} disabled={formState.isLoading}>
          Sign in
        </Button>
      </p>
    </motion.div>
  )
}

function AuthForgotPassword({
  onSignIn,
  onSuccess,
}: {
  onSignIn: () => void
  onSuccess: () => void
}) {
  const [formState, setFormState] = React.useState<FormState>({
    isLoading: false,
    error: null,
    showPassword: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setFormState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      onSuccess()
    } catch {
      setFormState((prev) => ({ ...prev, error: "An unexpected error occurred" }))
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-8"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4"
        onClick={onSignIn}
        disabled={formState.isLoading}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Back</span>
      </Button>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
      </div>

      <AuthError message={formState.error} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={formState.isLoading}
            className={cn(errors.email && "border-destructive")}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={formState.isLoading}>
          {formState.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Button variant="link" className="h-auto p-0 text-sm" onClick={onSignIn} disabled={formState.isLoading}>
          Sign in
        </Button>
      </p>
    </motion.div>
  )
}

function AuthResetSuccess({ onSignIn }: { onSignIn: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col items-center p-8 text-center"
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MailCheck className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Check your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">We sent a password reset link to your email.</p>
      <Button variant="outline" className="mt-6 w-full max-w-xs bg-transparent" onClick={onSignIn}>
        Back to sign in
      </Button>
      <p className="mt-6 text-xs text-muted-foreground">
        No email? Check spam or{" "}
        <Button variant="link" className="h-auto p-0 text-xs">
          try another email
        </Button>
      </p>
    </motion.div>
  )
}

export { Auth }

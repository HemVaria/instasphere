"use client"

import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import { useState, useRef } from "react"
import { Home, User, Briefcase, Mail, type LucideIcon } from "lucide-react"
import { useOnClickOutside } from "usehooks-ts"
import { Button } from "@/components/ui/button"

interface Tab {
  title: string
  icon: LucideIcon
}

interface NavbarProps {
  className?: string
  onSignInClick: () => void
}

interface BackgroundCirclesProps {
  title?: string
  className?: string
  variant?: keyof typeof COLOR_VARIANTS
  onSignInClick: () => void
}

const COLOR_VARIANTS = {
  primary: {
    border: ["border-emerald-500/60", "border-cyan-400/50", "border-slate-600/30"],
    gradient: "from-emerald-500/30",
  },
  secondary: {
    border: ["border-violet-500/60", "border-fuchsia-400/50", "border-slate-600/30"],
    gradient: "from-violet-500/30",
  },
  tertiary: {
    border: ["border-orange-500/60", "border-yellow-400/50", "border-slate-600/30"],
    gradient: "from-orange-500/30",
  },
  quaternary: {
    border: ["border-purple-500/60", "border-pink-400/50", "border-slate-600/30"],
    gradient: "from-purple-500/30",
  },
  quinary: {
    border: ["border-red-500/60", "border-rose-400/50", "border-slate-600/30"],
    gradient: "from-red-500/30",
  },
  senary: {
    border: ["border-blue-500/60", "border-sky-400/50", "border-slate-600/30"],
    gradient: "from-blue-500/30",
  },
  septenary: {
    border: ["border-gray-500/60", "border-gray-400/50", "border-slate-600/30"],
    gradient: "from-gray-500/30",
  },
  octonary: {
    border: ["border-red-500/60", "border-rose-400/50", "border-slate-600/30"],
    gradient: "from-red-500/30",
  },
} as const

const Navbar = ({ className, onSignInClick }: NavbarProps) => {
  const [selected, setSelected] = useState<number | null>(null)
  const outsideClickRef = useRef(null)

  useOnClickOutside(outsideClickRef, () => {
    setSelected(null)
  })

  const tabs: Tab[] = [
    { title: "Home", icon: Home },
    { title: "About", icon: User },
    { title: "Services", icon: Briefcase },
    { title: "Contact", icon: Mail },
  ]

  const buttonVariants = {
    initial: {
      gap: 0,
      paddingLeft: ".5rem",
      paddingRight: ".5rem",
    },
    animate: (isSelected: boolean) => ({
      gap: isSelected ? ".5rem" : 0,
      paddingLeft: isSelected ? "1rem" : ".5rem",
      paddingRight: isSelected ? "1rem" : ".5rem",
    }),
  }

  const spanVariants = {
    initial: { width: 0, opacity: 0 },
    animate: { width: "auto", opacity: 1 },
    exit: { width: 0, opacity: 0 },
  }

  const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 }

  return (
    <nav className={clsx("absolute top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-20 px-4", className)}>
      <div
        ref={outsideClickRef}
        className="flex items-center gap-1 sm:gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-1 shadow-lg"
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          return (
            <motion.button
              key={tab.title}
              variants={buttonVariants}
              initial={false}
              animate="animate"
              custom={selected === index}
              onClick={() => setSelected(selected === index ? null : index)}
              transition={transition}
              className={clsx(
                "relative flex items-center rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-300",
                selected === index ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={16} className="sm:w-5 sm:h-5" />
              <AnimatePresence initial={false}>
                {selected === index && (
                  <motion.span
                    variants={spanVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={transition}
                    className="overflow-hidden hidden sm:block"
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
        <Button
          onClick={onSignInClick}
          className="ml-2 bg-white/20 hover:bg-white/30 text-white border-white/20"
          size="sm"
        >
          Sign In
        </Button>
      </div>
    </nav>
  )
}

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
    animate={{
      backgroundPosition: ["0% 0%", "100% 100%"],
    }}
    transition={{
      duration: 40,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-20" />
  </motion.div>
)

export function BackgroundCircles({
  title = "Instasphere",
  className,
  variant = "octonary",
  onSignInClick,
}: BackgroundCirclesProps) {
  const variantStyles = COLOR_VARIANTS[variant]

  return (
    <div
      className={clsx(
        "relative flex h-screen w-full items-center justify-center overflow-hidden",
        "bg-white dark:bg-black/5",
        className,
      )}
    >
      <Navbar onSignInClick={onSignInClick} />
      <AnimatedGrid />

      <motion.div className="absolute h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] md:h-[480px] md:w-[480px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx(
              "absolute inset-0 rounded-full",
              "border-2 bg-gradient-to-br to-transparent",
              variantStyles.border[i],
              variantStyles.gradient,
            )}
            animate={{
              rotate: 360,
              scale: [1, 1.05 + i * 0.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <div
              className={clsx(
                "absolute inset-0 rounded-full mix-blend-screen",
                `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                  "from-",
                  "",
                )}/10%,transparent_70%)]`,
              )}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1
          className={clsx(
            "text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight px-4",
            "bg-gradient-to-b from-slate-950 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent",
            "drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]",
          )}
        >
          {title}
        </h1>
        <motion.p
          className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl dark:text-white text-slate-950 px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          connect with people you love
        </motion.p>
      </motion.div>

      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0F766E/30%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2DD4BF/15%,transparent)] blur-[80px]" />
      </div>
    </div>
  )
}

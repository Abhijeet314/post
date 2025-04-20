"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 bg-black dark:bg-white rounded-sm transition-colors"
    >
      <Sun className="h-5 w-5 text-white dark:text-black transition-all dark:hidden" />
      <Moon className="h-5 w-5 text-white dark:text-black transition-all hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

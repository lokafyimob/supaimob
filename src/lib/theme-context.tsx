'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      const body = document.body
      
      if (theme === 'dark') {
        root.classList.add('dark')
        body.classList.add('dark')
        body.style.backgroundColor = '#000000'
        body.style.color = '#ffffff'
      } else {
        root.classList.remove('dark')
        body.classList.remove('dark')
        body.style.backgroundColor = '#ffffff'
        body.style.color = '#000000'
      }

      localStorage.setItem('theme', theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div 
        suppressHydrationWarning
        style={{
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#000000',
          minHeight: '100vh'
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
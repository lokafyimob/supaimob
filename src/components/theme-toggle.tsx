'use client'

import { useTheme } from '@/lib/theme-context'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' }
  ] as const

  return (
    <div 
      className="flex items-center space-x-2 p-1 rounded-lg"
      style={{
        backgroundColor: theme === 'dark' ? '#333333' : '#f3f4f6'
      }}
    >
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: theme === value 
              ? (theme === 'dark' ? '#555555' : '#ffffff') 
              : 'transparent',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            boxShadow: theme === value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (theme !== value) {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#444444' : '#f9fafb'
            }
          }}
          onMouseLeave={(e) => {
            if (theme !== value) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Home, Bell } from 'lucide-react'

interface MatchNotificationProps {
  leadName: string
  propertyTitle: string
  propertyPrice: string
  onClose: () => void
  onViewMatches: () => void
}

export function MatchNotification({ 
  leadName, 
  propertyTitle, 
  propertyPrice, 
  onClose, 
  onViewMatches 
}: MatchNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 100)
    
    // Auto close after 8 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 8000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out ${
        isVisible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border-l-4 border-green-500 p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Sparkles className="w-5 h-5 text-green-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Novo Match! 🎉</h4>
              <p className="text-xs text-gray-500">Imóvel encontrado</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Bell className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-900">{leadName}</span>
          </div>
          <div className="flex items-center mb-1">
            <Home className="w-4 h-4 text-gray-600 mr-2" />
            <span className="text-sm text-gray-700">{propertyTitle}</span>
          </div>
          <div className="text-sm font-semibold text-green-600 ml-6">
            {propertyPrice}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewMatches}
            className="flex-1 bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Ver Todos os Matches
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-8000 ease-linear"
            style={{ 
              width: '100%',
              animation: 'shrink 8s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Context for managing match notifications
import { createContext, useContext, ReactNode } from 'react'

interface MatchNotificationContextType {
  showMatchNotification: (data: {
    leadName: string
    propertyTitle: string
    propertyPrice: string
    onViewMatches: () => void
  }) => void
}

const MatchNotificationContext = createContext<MatchNotificationContextType | undefined>(undefined)

export function MatchNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    leadName: string
    propertyTitle: string
    propertyPrice: string
    onViewMatches: () => void
  }>>([])
  const [counter, setCounter] = useState(0)

  const showMatchNotification = (data: {
    leadName: string
    propertyTitle: string
    propertyPrice: string
    onViewMatches: () => void
  }) => {
    setCounter(prev => prev + 1)
    const id = `notification-${counter + 1}`
    setNotifications(prev => [...prev, { ...data, id }])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <MatchNotificationContext.Provider value={{ showMatchNotification }}>
      {children}
      {notifications.map((notification) => (
        <MatchNotification
          key={notification.id}
          leadName={notification.leadName}
          propertyTitle={notification.propertyTitle}
          propertyPrice={notification.propertyPrice}
          onClose={() => removeNotification(notification.id)}
          onViewMatches={notification.onViewMatches}
        />
      ))}
    </MatchNotificationContext.Provider>
  )
}

export function useMatchNotification() {
  const context = useContext(MatchNotificationContext)
  if (context === undefined) {
    throw new Error('useMatchNotification must be used within a MatchNotificationProvider')
  }
  return context
}
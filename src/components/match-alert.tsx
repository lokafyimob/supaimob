'use client'

import { useState, useEffect } from 'react'
import { Bell, Sparkles, X, Phone, Eye } from 'lucide-react'
import { notificationSounds } from '@/lib/notification-sounds'

interface MatchAlertProps {
  matches: {
    leadId: string
    leadName: string
    leadPhone: string
    propertyTitle: string
    propertyPrice: number
    matchType: 'RENT' | 'BUY'
  }[]
  onDismiss: () => void
  onViewMatches: (leadId: string) => void
}

export function MatchAlert({ matches, onDismiss, onViewMatches }: MatchAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  useEffect(() => {
    if (matches.length > 0) {
      setIsVisible(true)
      
      // 🎵 Play match sound when alert appears
      notificationSounds.playByType('match')
      
      // Auto-rotate through matches if there are multiple
      if (matches.length > 1) {
        const interval = setInterval(() => {
          setCurrentMatchIndex((prev) => {
            const newIndex = (prev + 1) % matches.length
            // Play sound for each new match
            notificationSounds.playByType('match')
            return newIndex
          })
        }, 4000) // Change every 4 seconds
        
        return () => clearInterval(interval)
      }
    }
  }, [matches])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation to complete
  }

  if (matches.length === 0 || !isVisible) return null

  const currentMatch = matches[currentMatchIndex]

  return (
    <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-500 ease-out ${
      isVisible 
        ? 'translate-y-0 opacity-100 scale-100' 
        : 'translate-y-full opacity-0 scale-95'
    }`}>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-2xl p-6 max-w-sm min-w-[320px] relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* Header with animated bell */}
          <div className="flex items-center mb-3">
            <div className="relative">
              <Bell className="w-6 h-6 mr-2 animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="font-bold text-lg">
              🎯 Novo Match Encontrado!
            </h3>
          </div>

          {/* Match info */}
          <div className="space-y-2 mb-4">
            <div className="text-sm opacity-90">
              <span className="font-semibold">{currentMatch.leadName}</span> 
              {' '}está procurando para{' '}
              <span className="font-semibold">
                {currentMatch.matchType === 'RENT' ? 'alugar' : 'comprar'}
              </span>
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-sm mb-1">
                📍 {currentMatch.propertyTitle}
              </div>
              <div className="text-lg font-bold">
                {formatCurrency(currentMatch.propertyPrice)}
              </div>
            </div>

            <div className="text-xs opacity-80 flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {currentMatch.leadPhone}
            </div>
          </div>

          {/* Multiple matches indicator */}
          {matches.length > 1 && (
            <div className="flex justify-center mb-3">
              <div className="flex space-x-1">
                {matches.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentMatchIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(`tel:${currentMatch.leadPhone}`, '_self')}
              className="flex-1 bg-white text-green-600 font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center"
            >
              <Phone className="w-4 h-4 mr-1" />
              Ligar Agora
            </button>
            <button
              onClick={() => onViewMatches(currentMatch.leadId)}
              className="flex-1 bg-white/20 text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/30 transition-colors text-sm flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Todos
            </button>
          </div>

          {/* Total matches counter */}
          {matches.length > 1 && (
            <div className="text-center mt-2 text-xs opacity-80">
              +{matches.length - 1} outros matches encontrados
            </div>
          )}
        </div>

        {/* Sparkles animation */}
        <div className="absolute top-2 left-2">
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
        <div className="absolute bottom-2 right-8">
          <Sparkles className="w-3 h-3 text-yellow-200 animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  )
}
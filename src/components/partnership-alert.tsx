'use client'

import { useState, useEffect } from 'react'
import { Handshake, Sparkles, X, Phone, Eye, Users } from 'lucide-react'
import { notificationSounds } from '@/lib/notification-sounds'

interface PartnershipAlertProps {
  partnerships: {
    fromUserName: string
    fromUserPhone: string | null
    fromUserEmail: string
    leadName: string
    leadPhone: string
    propertyTitle: string
    propertyPrice: number
    matchType: 'RENT' | 'BUY'
  }[]
  onDismiss: () => void
  onViewPartnerships: () => void
}

export function PartnershipAlert({ partnerships, onDismiss, onViewPartnerships }: PartnershipAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentPartnershipIndex, setCurrentPartnershipIndex] = useState(0)

  useEffect(() => {
    if (partnerships.length > 0) {
      setIsVisible(true)
      
      // 🎵 Play partnership sound when alert appears
      notificationSounds.playByType('partnership')
      
      // Auto-rotate through partnerships if there are multiple
      if (partnerships.length > 1) {
        const interval = setInterval(() => {
          setCurrentPartnershipIndex((prev) => {
            const newIndex = (prev + 1) % partnerships.length
            // Play sound for each new partnership
            notificationSounds.playByType('partnership')
            return newIndex
          })
        }, 4000) // Change every 4 seconds
        
        return () => clearInterval(interval)
      }
    }
  }, [partnerships])

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

  if (partnerships.length === 0 || !isVisible) return null

  const currentPartnership = partnerships[currentPartnershipIndex]

  return (
    <div className={`fixed bottom-6 left-6 z-50 transform transition-all duration-500 ease-out ${
      isVisible 
        ? 'translate-y-0 opacity-100 scale-100' 
        : 'translate-y-full opacity-0 scale-95'
    }`}>
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-2xl p-6 max-w-sm min-w-[320px] relative overflow-hidden">
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
          {/* Header with animated handshake */}
          <div className="flex items-center mb-3">
            <div className="relative">
              <Handshake className="w-6 h-6 mr-2 animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h3 className="font-bold text-lg">
              🤝 Oportunidade de Parceria!
            </h3>
          </div>

          {/* Partnership info */}
          <div className="space-y-2 mb-4">
            <div className="text-sm opacity-90">
              O corretor{' '}
              <span className="font-semibold">{currentPartnership.fromUserName}</span> 
              {' '}tem um cliente interessado em{' '}
              <span className="font-semibold">
                {currentPartnership.matchType === 'RENT' ? 'alugar' : 'comprar'}
              </span>
              {' '}seu imóvel
            </div>
            
            <div className="bg-white/20 rounded-lg p-3">
              <div className="font-semibold text-sm mb-1">
                🏠 {currentPartnership.propertyTitle}
              </div>
              <div className="text-lg font-bold">
                {formatCurrency(currentPartnership.propertyPrice)}
              </div>
            </div>

            <div className="bg-white/15 rounded-lg p-3">
              <div className="text-xs opacity-90 mb-2">💼 Contato do Corretor:</div>
              <div className="font-semibold text-base mb-2">{currentPartnership.fromUserName}</div>
              <div className="space-y-1">
                {currentPartnership.fromUserPhone && (
                  <div className="text-sm flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-white/80" />
                    {currentPartnership.fromUserPhone}
                  </div>
                )}
                <div className="text-sm flex items-center">
                  <Users className="w-4 h-4 mr-2 text-white/80" />
                  {currentPartnership.fromUserEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Multiple partnerships indicator */}
          {partnerships.length > 1 && (
            <div className="flex justify-center mb-3">
              <div className="flex space-x-1">
                {partnerships.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentPartnershipIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (currentPartnership.fromUserPhone) {
                  window.open(`tel:${currentPartnership.fromUserPhone}`, '_self')
                } else {
                  window.open(`mailto:${currentPartnership.fromUserEmail}`, '_self')
                }
              }}
              className="flex-1 bg-white text-blue-600 font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center"
            >
              <Phone className="w-4 h-4 mr-1" />
              {currentPartnership.fromUserPhone ? 'Ligar Corretor' : 'Email Corretor'}
            </button>
            <button
              onClick={onViewPartnerships}
              className="flex-1 bg-white/20 text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/30 transition-colors text-sm flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Todas
            </button>
          </div>

          {/* Total partnerships counter */}
          {partnerships.length > 1 && (
            <div className="text-center mt-2 text-xs opacity-80">
              +{partnerships.length - 1} outras oportunidades de parceria
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
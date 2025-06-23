'use client'

import { useState, useEffect } from 'react'
import { Handshake, Sparkles, X, Phone, Eye, Users, MessageCircle } from 'lucide-react'
import { notificationSounds } from '@/lib/notification-sounds'

// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.413 3.506"/>
  </svg>
)

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
      
      // 🎵 Play red sound when alert appears
      notificationSounds.playByType('red')
      
      // Auto-rotate through partnerships if there are multiple
      if (partnerships.length > 1) {
        const interval = setInterval(() => {
          setCurrentPartnershipIndex((prev) => {
            const newIndex = (prev + 1) % partnerships.length
            // Play sound for each new partnership
            notificationSounds.playByType('red')
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
                  // Format phone number for WhatsApp (remove non-digits and add country code if needed)
                  let phoneNumber = currentPartnership.fromUserPhone.replace(/\D/g, '')
                  
                  // Add Brazil country code if not present
                  if (phoneNumber.length === 11 && phoneNumber.startsWith('9')) {
                    phoneNumber = '55' + phoneNumber
                  } else if (phoneNumber.length === 10) {
                    phoneNumber = '559' + phoneNumber
                  } else if (!phoneNumber.startsWith('55')) {
                    phoneNumber = '55' + phoneNumber
                  }
                  
                  // Create WhatsApp message
                  const message = encodeURIComponent(
                    `Olá ${currentPartnership.fromUserName}! Vi que você tem um cliente interessado no imóvel "${currentPartnership.propertyTitle}". Vamos conversar sobre esta parceria?`
                  )
                  
                  // Open WhatsApp
                  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
                } else {
                  window.open(`mailto:${currentPartnership.fromUserEmail}`, '_self')
                }
              }}
              className="flex-1 bg-white font-semibold py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-xs flex items-center justify-center"
              style={currentPartnership.fromUserPhone ? { color: '#25D366' } : { color: '#3B82F6' }}
            >
              {currentPartnership.fromUserPhone ? (
                <WhatsAppIcon className="w-4 h-4 mr-1" />
              ) : (
                <Phone className="w-4 h-4 mr-1" />
              )}
              {currentPartnership.fromUserPhone ? 'WhatsApp Corretor' : 'Email Corretor'}
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
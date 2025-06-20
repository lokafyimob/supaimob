'use client'

import { useState, useEffect } from 'react'
import { Crown, Sparkles, X, Phone, Eye, Star, Diamond } from 'lucide-react'

interface VipAlertProps {
  vipLeads: {
    leadId: string
    leadName: string
    leadPhone: string
    propertyTitle: string
    propertyPrice: number
    matchType: 'RENT' | 'BUY'
    vipLevel: 'GOLD' | 'PLATINUM' | 'DIAMOND'
    budget: number
  }[]
  onDismiss: () => void
  onViewLeads: (leadId: string) => void
}

export function VipAlert({ vipLeads, onDismiss, onViewLeads }: VipAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)

  // 🎵 Audio files for different VIP levels
  const playVipSound = (vipLevel: string) => {
    try {
      let soundFile = ''
      switch (vipLevel) {
        case 'GOLD':
          soundFile = '/sounds/vip-gold.mp3'
          break
        case 'PLATINUM':
          soundFile = '/sounds/vip-platinum.mp3'
          break
        case 'DIAMOND':
          soundFile = '/sounds/vip-diamond.mp3'
          break
        default:
          soundFile = '/sounds/vip-default.mp3'
      }
      
      const audio = new Audio(soundFile)
      audio.volume = 0.6
      audio.play().catch(error => {
        console.log('Sound not available:', error)
        // Fallback notification sound
        const fallbackAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBjiN1+3OeiwEJHfH8N2QQAoUXrTp66hVFApGn+DyvmMdBg==')
        fallbackAudio.volume = 0.3
        fallbackAudio.play().catch(() => {})
      })
    } catch (error) {
      console.log('Audio error:', error)
    }
  }

  useEffect(() => {
    if (vipLeads.length > 0) {
      setIsVisible(true)
      
      // Play VIP sound when alert appears
      const currentLead = vipLeads[currentLeadIndex]
      playVipSound(currentLead.vipLevel)
      
      // Auto-rotate through VIP leads if there are multiple
      if (vipLeads.length > 1) {
        const interval = setInterval(() => {
          setCurrentLeadIndex((prev) => {
            const newIndex = (prev + 1) % vipLeads.length
            // Play sound for new lead
            playVipSound(vipLeads[newIndex].vipLevel)
            return newIndex
          })
        }, 5000) // Change every 5 seconds for VIP
        
        return () => clearInterval(interval)
      }
    }
  }, [vipLeads])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getVipColors = (vipLevel: string) => {
    switch (vipLevel) {
      case 'GOLD':
        return {
          gradient: 'from-yellow-400 to-amber-500',
          accent: 'bg-yellow-300',
          icon: Crown,
          emoji: '👑'
        }
      case 'PLATINUM':
        return {
          gradient: 'from-gray-300 to-slate-400',
          accent: 'bg-gray-200',
          icon: Star,
          emoji: '⭐'
        }
      case 'DIAMOND':
        return {
          gradient: 'from-cyan-400 to-blue-500',
          accent: 'bg-cyan-300',
          icon: Diamond,
          emoji: '💎'
        }
      default:
        return {
          gradient: 'from-yellow-400 to-amber-500',
          accent: 'bg-yellow-300',
          icon: Crown,
          emoji: '👑'
        }
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300)
  }

  if (vipLeads.length === 0 || !isVisible) return null

  const currentLead = vipLeads[currentLeadIndex]
  const vipStyle = getVipColors(currentLead.vipLevel)
  const VipIcon = vipStyle.icon

  return (
    <div className={`fixed top-6 right-6 z-50 transform transition-all duration-700 ease-out ${
      isVisible 
        ? 'translate-y-0 opacity-100 scale-100' 
        : '-translate-y-full opacity-0 scale-95'
    }`}>
      <div className={`bg-gradient-to-r ${vipStyle.gradient} text-white rounded-xl shadow-2xl p-6 max-w-sm min-w-[340px] relative overflow-hidden border-2 border-white/30`}>
        
        {/* Animated luxury background pattern */}
        <div className="absolute inset-0 bg-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer-luxury"></div>
        </div>
        
        {/* Floating sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white animate-pulse" />
          <Sparkles className="absolute top-4 right-8 w-3 h-3 text-white/80 animate-ping" style={{ animationDelay: '0.5s' }} />
          <Sparkles className="absolute bottom-8 left-8 w-3 h-3 text-white/60 animate-pulse" style={{ animationDelay: '1s' }} />
          <Sparkles className="absolute bottom-4 right-4 w-4 h-4 text-white animate-ping" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors z-10 bg-black/20 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          {/* VIP Header with animated crown/icon */}
          <div className="flex items-center mb-4">
            <div className="relative mr-3">
              <VipIcon className="w-8 h-8 animate-bounce" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 ${vipStyle.accent} rounded-full animate-pulse`}></div>
            </div>
            <div>
              <h3 className="font-bold text-xl">
                {vipStyle.emoji} Cliente VIP {currentLead.vipLevel}
              </h3>
              <p className="text-sm opacity-90">Lead Premium Detectado!</p>
            </div>
          </div>

          {/* VIP Lead info */}
          <div className="space-y-3 mb-4">
            <div className="text-sm opacity-95">
              <span className="font-bold text-lg">{currentLead.leadName}</span> 
              {' '}quer{' '}
              <span className="font-semibold">
                {currentLead.matchType === 'RENT' ? 'alugar' : 'comprar'}
              </span>
              {' '}com orçamento de{' '}
              <span className="font-bold text-lg">
                {formatCurrency(currentLead.budget)}
              </span>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4 border border-white/30">
              <div className="font-semibold text-base mb-2 flex items-center">
                🏠 {currentLead.propertyTitle}
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(currentLead.propertyPrice)}
              </div>
              <div className="text-xs opacity-80 mt-1">
                Compatibilidade: {Math.round((currentLead.budget / currentLead.propertyPrice) * 100)}%
              </div>
            </div>

            <div className="bg-white/20 rounded-lg p-3 border border-white/20">
              <div className="text-xs opacity-90 mb-2">📞 Contato VIP:</div>
              <div className="text-sm flex items-center font-semibold">
                <Phone className="w-4 h-4 mr-2 text-white" />
                {currentLead.leadPhone}
              </div>
            </div>
          </div>

          {/* Multiple VIP leads indicator */}
          {vipLeads.length > 1 && (
            <div className="flex justify-center mb-4">
              <div className="flex space-x-1">
                {vipLeads.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 border border-white/50 ${
                      index === currentLeadIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIP Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                window.open(`tel:${currentLead.leadPhone}`, '_self')
                playVipSound(currentLead.vipLevel) // Play sound on action
              }}
              className="flex-1 bg-white text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm flex items-center justify-center shadow-lg transform hover:scale-105"
            >
              <Phone className="w-4 h-4 mr-2" />
              Ligar VIP Agora
            </button>
            <button
              onClick={() => onViewLeads(currentLead.leadId)}
              className="flex-1 bg-black/30 text-white font-bold py-3 px-4 rounded-lg hover:bg-black/40 transition-all duration-200 text-sm flex items-center justify-center border border-white/30"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Perfil
            </button>
          </div>

          {/* VIP Benefits reminder */}
          <div className="text-center mt-3 text-xs opacity-90 bg-black/20 rounded-lg p-2">
            {currentLead.vipLevel === 'DIAMOND' && '💎 Cliente Diamante - Prioridade Máxima!'}
            {currentLead.vipLevel === 'PLATINUM' && '⭐ Cliente Platinum - Alta Prioridade!'}
            {currentLead.vipLevel === 'GOLD' && '👑 Cliente Gold - Prioridade Elevada!'}
          </div>

          {/* Total VIP leads counter */}
          {vipLeads.length > 1 && (
            <div className="text-center mt-2 text-xs opacity-80">
              +{vipLeads.length - 1} outros clientes VIP aguardando
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer-luxury {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer-luxury {
          animation: shimmer-luxury 4s infinite;
        }
      `}</style>
    </div>
  )
}
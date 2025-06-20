'use client'

import { useState } from 'react'
import { Play, Volume2, VolumeX } from 'lucide-react'
import { notificationSounds } from '@/lib/notification-sounds'

export function SoundTestPanel() {
  const [isMuted, setIsMuted] = useState(false)

  const sounds = [
    { type: 'match' as const, name: 'Match de Lead', color: 'bg-green-500', icon: '🎯' },
    { type: 'partnership' as const, name: 'Parceria', color: 'bg-blue-500', icon: '🤝' },
    { type: 'vip-gold' as const, name: 'VIP Gold', color: 'bg-yellow-500', icon: '👑' },
    { type: 'vip-platinum' as const, name: 'VIP Platinum', color: 'bg-gray-400', icon: '⭐' },
    { type: 'vip-diamond' as const, name: 'VIP Diamond', color: 'bg-cyan-500', icon: '💎' },
    { type: 'urgent' as const, name: 'Lead Urgente', color: 'bg-red-500', icon: '🚨' },
    { type: 'night' as const, name: 'Lead Noturno', color: 'bg-purple-600', icon: '🌙' },
    { type: 'high-value' as const, name: 'Alto Valor', color: 'bg-orange-500', icon: '💰' },
  ]

  const playSound = (type: any) => {
    if (!isMuted) {
      notificationSounds.playByType(type)
    }
  }

  const testAllSounds = () => {
    if (!isMuted) {
      notificationSounds.testAllSounds()
    }
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 max-w-xs z-50 border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🎵 Test Sons</h3>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-1 rounded ${isMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
        {sounds.map((sound) => (
          <button
            key={sound.type}
            onClick={() => playSound(sound.type)}
            disabled={isMuted}
            className={`w-full flex items-center space-x-2 p-2 rounded text-white text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${sound.color}`}
          >
            <span>{sound.icon}</span>
            <span className="flex-1 text-left">{sound.name}</span>
            <Play className="w-3 h-3" />
          </button>
        ))}
      </div>

      <button
        onClick={testAllSounds}
        disabled={isMuted}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded text-xs font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🎼 Testar Todos (8s)
      </button>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {notificationSounds.isAudioAvailable() ? '🔊 Áudio disponível' : '🔇 Áudio indisponível'}
      </div>
    </div>
  )
}
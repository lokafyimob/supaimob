'use client'

import { useState } from 'react'
import { X, Volume2, Play } from 'lucide-react'
import { notificationSounds } from '@/lib/notification-sounds'

interface SoundTestModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SoundTestModal({ isOpen, onClose }: SoundTestModalProps) {
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  
  if (!isOpen) return null

  const availableSounds = notificationSounds.getAvailableSounds()
  
  // Group sounds by category
  const soundsByCategory = availableSounds.reduce((acc, sound) => {
    const category = sound.category || 'Outros'
    if (!acc[category]) acc[category] = []
    acc[category].push(sound)
    return acc
  }, {} as Record<string, typeof availableSounds>)

  const playSound = (soundType: string) => {
    setPlayingSound(soundType)
    notificationSounds.playSoundWithLog(soundType)
    
    // Clear playing state after 2 seconds
    setTimeout(() => {
      setPlayingSound(null)
    }, 2000)
  }

  const getVolumeColor = (volume: number) => {
    if (volume <= 0.3) return 'text-green-600'
    if (volume <= 0.5) return 'text-yellow-600'
    if (volume <= 0.7) return 'text-orange-600'
    return 'text-red-600'
  }

  const getVolumeLabel = (volume: number) => {
    if (volume <= 0.3) return 'Suave'
    if (volume <= 0.5) return 'Médio'
    if (volume <= 0.7) return 'Alto'
    return 'Forte'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Volume2 className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Sons de Notificação
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Agora você tem acesso a {availableSounds.length} sons diferentes organizados por categorias! Clique nos botões para testar.
          </p>

          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(soundsByCategory).map(([category, sounds]) => (
              <div key={category} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider border-b border-gray-300 dark:border-gray-600 pb-2">
                  {category} ({sounds.length})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sounds.map((sound) => (
                    <div
                      key={sound.type}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-3 border-2 transition-all duration-200 ${
                        playingSound === sound.type 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {sound.name}
                        </h4>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${getVolumeColor(sound.volume)} bg-gray-100 dark:bg-gray-600`}>
                          {getVolumeLabel(sound.volume)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {sound.description}
                      </p>
                      
                      <button
                        onClick={() => playSound(sound.type)}
                        disabled={playingSound === sound.type}
                        className={`w-full flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 text-xs ${
                          playingSound === sound.type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {playingSound === sound.type ? (
                          <>
                            <div className="animate-pulse mr-2">🔊</div>
                            Tocando...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-2" />
                            Testar
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Como usar no console:
            </h4>
            <code className="text-sm text-blue-800 dark:text-blue-200 block">
              notificationSounds.playByType('red') // Toca som específico
            </code>
            <code className="text-sm text-blue-800 dark:text-blue-200 block mt-1">
              notificationSounds.getAvailableSounds() // Lista todos os sons
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
// 🎵 Sistema de Sons para Notificações de Leads

export class NotificationSounds {
  private audioContext: AudioContext | null = null

  constructor() {
    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // 🎵 Som para Match de Lead Normal (Verde)
  playMatchSound() {
    this.playTone([800, 1000, 1200], 0.3, 'sine')
  }

  // 🤝 Som para Parceria (Azul)
  playPartnershipSound() {
    this.playTone([600, 800, 600], 0.4, 'triangle')
  }

  // 👑 Som para Lead VIP Gold
  playVipGoldSound() {
    this.playTone([1200, 1400, 1600, 1800], 0.5, 'sawtooth')
  }

  // ⭐ Som para Lead VIP Platinum
  playVipPlatinumSound() {
    this.playTone([1000, 1300, 1600, 1300, 1000], 0.6, 'sine')
  }

  // 💎 Som para Lead VIP Diamond
  playVipDiamondSound() {
    this.playTone([1500, 1800, 2100, 2400, 2100, 1800], 0.7, 'triangle')
  }

  // 🚨 Som para Lead Urgente
  playUrgentSound() {
    this.playTone([1000, 500, 1000, 500, 1000], 0.8, 'square')
  }

  // 🌙 Som para Lead Noturno (mais suave)
  playNightSound() {
    this.playTone([400, 600, 800], 0.2, 'sine')
  }

  // 💰 Som para Lead Alto Valor
  playHighValueSound() {
    this.playTone([800, 1200, 1600, 2000, 1600, 1200], 0.6, 'sawtooth')
  }

  private playTone(frequencies: number[], volume: number = 0.5, waveType: OscillatorType = 'sine') {
    if (!this.audioContext) return

    try {
      const duration = 0.15 // Duration of each note
      const gap = 0.05 // Gap between notes

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)

        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime)
        oscillator.type = waveType

        // Envelope for smooth sound
        const startTime = this.audioContext!.currentTime + (index * (duration + gap))
        const endTime = startTime + duration

        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, endTime)

        oscillator.start(startTime)
        oscillator.stop(endTime)
      })
    } catch (error) {
      console.log('Audio playback error:', error)
      // Fallback to simple beep
      this.playSimpleBeep()
    }
  }

  // Fallback simple beep
  private playSimpleBeep() {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Simple beep error:', error)
    }
  }

  // 🎯 Som por tipo de lead
  playByType(type: 'match' | 'partnership' | 'vip-gold' | 'vip-platinum' | 'vip-diamond' | 'urgent' | 'night' | 'high-value') {
    switch (type) {
      case 'match':
        this.playMatchSound()
        break
      case 'partnership':
        this.playPartnershipSound()
        break
      case 'vip-gold':
        this.playVipGoldSound()
        break
      case 'vip-platinum':
        this.playVipPlatinumSound()
        break
      case 'vip-diamond':
        this.playVipDiamondSound()
        break
      case 'urgent':
        this.playUrgentSound()
        break
      case 'night':
        this.playNightSound()
        break
      case 'high-value':
        this.playHighValueSound()
        break
      default:
        this.playMatchSound()
    }
  }

  // 🔇 Verificar se áudio está disponível
  isAudioAvailable(): boolean {
    return !!this.audioContext
  }

  // 🔊 Testar todos os sons
  testAllSounds() {
    const sounds = ['match', 'partnership', 'vip-gold', 'vip-platinum', 'vip-diamond', 'urgent', 'night', 'high-value'] as const
    
    sounds.forEach((sound, index) => {
      setTimeout(() => {
        console.log(`🎵 Testing ${sound} sound`)
        this.playByType(sound)
      }, index * 1000)
    })
  }
}

// Singleton instance
export const notificationSounds = new NotificationSounds()
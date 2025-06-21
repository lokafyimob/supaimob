import { useState, useEffect, useCallback } from 'react'

interface LeadNotification {
  id: string
  leadId: string
  propertyId: string
  type: string
  title: string
  message: string
  sent: boolean
  createdAt: string
  leadName: string
  leadPhone: string
  matchType: 'RENT' | 'BUY'
  propertyTitle: string
  propertyPrice: number
}

export function useLeadNotifications() {
  const [notifications, setNotifications] = useState<LeadNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/leads/notifications')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar notificações')
      }
      
      setNotifications(data.notifications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar notificações:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsSent = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/leads/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao marcar notificações')
      }
      
      // Remove notificações marcadas da lista local
      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao marcar notificações:', err)
      return false
    }
  }, [])

  // Buscar notificações ao montar o componente
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Polling para verificar novas notificações a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsSent,
    hasNotifications: notifications.length > 0
  }
}
import { useState, useEffect, useCallback } from 'react'
import { notificationEvents, NOTIFICATION_EVENTS } from '@/lib/notification-events'

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
  const [lastCount, setLastCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Buscando notificações de leads...')
      const response = await fetch('/api/leads/notifications')
      const data = await response.json()
      
      console.log('📬 Resposta da API:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar notificações')
      }
      
      const notifications = data.notifications || []
      console.log(`🔔 ${notifications.length} notificações encontradas:`, notifications)
      
      // Detectar novas notificações
      if (notifications.length > lastCount && lastCount > 0) {
        console.log(`🆕 ${notifications.length - lastCount} novas notificações detectadas!`)
        // Force re-render para garantir que alertas apareçam
        setTimeout(() => {
          setNotifications([...notifications])
        }, 100)
      } else {
        setNotifications(notifications)
      }
      
      setLastCount(notifications.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('❌ Erro ao buscar notificações:', err)
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

  // Polling para verificar novas notificações a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Escutar eventos para verificação imediata
  useEffect(() => {
    const handleCheckNotifications = () => {
      console.log('🚨 Evento recebido: verificando notificações imediatamente')
      fetchNotifications()
    }

    notificationEvents.on(NOTIFICATION_EVENTS.CHECK_NOTIFICATIONS, handleCheckNotifications)
    notificationEvents.on(NOTIFICATION_EVENTS.PROPERTY_UPDATED, handleCheckNotifications)
    notificationEvents.on(NOTIFICATION_EVENTS.LEAD_CREATED, handleCheckNotifications)

    return () => {
      notificationEvents.off(NOTIFICATION_EVENTS.CHECK_NOTIFICATIONS, handleCheckNotifications)
      notificationEvents.off(NOTIFICATION_EVENTS.PROPERTY_UPDATED, handleCheckNotifications)
      notificationEvents.off(NOTIFICATION_EVENTS.LEAD_CREATED, handleCheckNotifications)
    }
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
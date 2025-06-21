'use client'

import { useState, useEffect } from 'react'
import { MapPin, X, ExternalLink, Clock } from 'lucide-react'

interface LocationNotification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  lead: {
    id: string
    name: string
    phone: string
    preferredLocation: string
  }
  property: {
    id: string
    title: string
    address: string
    price: number
    user: {
      name: string
      email: string
    }
  }
}

interface LocationNotificationsProps {
  onClose?: () => void
}

export function LocationNotifications({ onClose }: LocationNotificationsProps) {
  const [notifications, setNotifications] = useState<LocationNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/location-notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching location notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/location-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`
    return `${Math.floor(diffInMinutes / 1440)}d atrás`
  }

  const getLocationInfo = (preferredLocation: string) => {
    try {
      const location = JSON.parse(preferredLocation)
      return {
        address: location.address,
        radius: location.radius
      }
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <MapPin className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notificações de Localização
            </h2>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} novas notificações` : 'Todas as notificações lidas'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma notificação de localização
            </h3>
            <p className="text-gray-500">
              Quando novos imóveis forem cadastrados nas áreas de interesse dos seus leads, você será notificado aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const locationInfo = getLocationInfo(notification.lead.preferredLocation)
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-red-50 border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Lead and Property Info */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {notification.lead.name}
                            </h4>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {notification.lead.phone}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <h5 className="font-medium text-gray-900 mb-1">
                              {notification.property.title}
                            </h5>
                            <p className="text-sm text-gray-600 mb-1">
                              {notification.property.address}
                            </p>
                            <p className="text-sm font-medium text-green-600">
                              R$ {notification.property.price.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Proprietário: {notification.property.user.name}
                            </p>
                          </div>

                          {locationInfo && (
                            <div className="text-xs text-gray-500 mb-2">
                              <span className="font-medium">Área de interesse:</span> {locationInfo.address} 
                              <span className="ml-2">({locationInfo.radius}km de raio)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(notification.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/properties?propertyId=${notification.property.id}`, '_blank')}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver Imóvel
                          </button>
                          
                          <button
                            onClick={() => window.open(`/leads?leadId=${notification.lead.id}`, '_blank')}
                            className="inline-flex items-center px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Ver Lead
                          </button>
                          
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{notifications.length} notificações</span>
            <button
              onClick={() => {
                // Mark all as read
                notifications.forEach(notif => {
                  if (!notif.isRead) {
                    markAsRead(notif.id)
                  }
                })
              }}
              className="text-red-600 hover:text-red-800"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
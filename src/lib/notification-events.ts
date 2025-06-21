// Sistema de eventos para notificações
class NotificationEventEmitter {
  private listeners: { [key: string]: Function[] } = {}

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
  }

  emit(event: string, data?: any) {
    if (!this.listeners[event]) return
    this.listeners[event].forEach(callback => callback(data))
  }
}

export const notificationEvents = new NotificationEventEmitter()

// Eventos disponíveis
export const NOTIFICATION_EVENTS = {
  PROPERTY_UPDATED: 'property_updated',
  LEAD_CREATED: 'lead_created',
  CHECK_NOTIFICATIONS: 'check_notifications'
}
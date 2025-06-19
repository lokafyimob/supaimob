'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)
  const [isPaused, setIsPaused] = useState(false)

  const handleRemove = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 200)
  }, [onRemove, toast.id])

  useEffect(() => {
    // Animação de entrada com bounce
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-dismiss with progress bar
    if (toast.duration && toast.duration > 0 && !isPaused) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 50))
          if (newProgress <= 0) {
            clearInterval(interval)
            handleRemove()
            return 0
          }
          return newProgress
        })
      }, 50)
      
      return () => clearInterval(interval)
    }
  }, [toast.duration, handleRemove, isPaused])

  const getIconAndColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" style={{color: '#22c55e'}} />,
          bgColor: 'bg-white border-green-300',
          iconColor: '',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        }
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        }
      case 'info':
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        }
    }
  }

  const { icon, bgColor, iconColor, titleColor, messageColor } = getIconAndColors()

  return (
    <div
      className={`w-full ${bgColor} border rounded-lg shadow-xl pointer-events-auto transform hover:scale-105 hover:shadow-2xl cursor-pointer ${
        isVisible && !isExiting
          ? 'animate-bounce-in'
          : isExiting
          ? 'animate-slide-out'
          : 'translate-x-full opacity-0'
      }`}
      style={toast.type === 'success' ? {backgroundColor: '#ffffff'} : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            {icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${titleColor}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm ${messageColor}`}>
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`rounded-md inline-flex ${iconColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={handleRemove}
            >
              <span className="sr-only">Fechar</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-b-lg">
          <div 
            className={`h-full transition-all duration-75 ease-linear ${
              isPaused 
                ? toast.type === 'success' 
                  ? 'animate-progress-pulse-success' 
                  : 'animate-progress-pulse-error'
                : ''
            }`}
            style={{
              width: `${progress}%`,
              backgroundColor: toast.type === 'success' 
                ? '#22c55e' 
                : toast.type === 'error' 
                ? '#ef4444' 
                : toast.type === 'warning' 
                ? '#f59e0b' 
                : '#3b82f6'
            }}
          />
        </div>
      )}
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook para gerenciar toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [counter, setCounter] = useState(0)

  const addToast = (
    type: Toast['type'],
    title: string,
    message?: string,
    duration: number = 5000
  ) => {
    setCounter(prev => prev + 1)
    const id = `toast-${counter + 1}`
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration
    }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message?: string) => 
    addToast('success', title, message)
  
  const showError = (title: string, message?: string) => 
    addToast('error', title, message)
  
  const showWarning = (title: string, message?: string) => 
    addToast('warning', title, message)
  
  const showInfo = (title: string, message?: string) => 
    addToast('info', title, message)

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}
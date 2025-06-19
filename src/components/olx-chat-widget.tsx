'use client'

import { useState } from 'react'

interface OLXChatWidgetProps {
  chatId?: string
  leadName?: string
  propertyTitle?: string
}

export default function OLXChatWidget({ 
  chatId, 
  leadName, 
  propertyTitle 
}: OLXChatWidgetProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSendMessage = async () => {
    if (!message.trim() || !chatId) {
      setStatus({
        type: 'error',
        message: 'Mensagem e Chat ID são obrigatórios'
      })
      return
    }

    setIsLoading(true)
    setStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/olx-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId,
          message: message.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Mensagem enviada com sucesso!'
        })
        setMessage('') // Limpar o campo
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Erro ao enviar mensagem'
        })
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Erro de conexão. Tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">OLX</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Chat OLX</h3>
          {(leadName || propertyTitle) && (
            <p className="text-sm text-gray-600">
              {leadName && `Lead: ${leadName}`}
              {leadName && propertyTitle && ' • '}
              {propertyTitle && `Imóvel: ${propertyTitle}`}
            </p>
          )}
        </div>
      </div>

      {!chatId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Chat ID não configurado. Configure o Chat ID para enviar mensagens.
          </p>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4">
          <p className="text-xs text-blue-700">
            Chat ID: <code className="bg-blue-100 px-1 rounded">{chatId}</code>
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para o cliente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
            disabled={isLoading || !chatId}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={isLoading || !message.trim() || !chatId}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar via OLX
            </>
          )}
        </button>

        {status.type && (
          <div className={`p-3 rounded-md ${
            status.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{status.message}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 Dica: Use Enter para enviar, Shift+Enter para quebrar linha
        </p>
      </div>
    </div>
  )
}
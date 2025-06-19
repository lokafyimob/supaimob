'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import OLXChatWidget from '@/components/olx-chat-widget'
import { 
  MessageCircle, 
  Settings, 
  Key, 
  TestTube,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'

interface OLXSettings {
  token: string
  defaultChatId: string
}

export default function OLXChatPage() {
  const [settings, setSettings] = useState<OLXSettings>({
    token: '',
    defaultChatId: ''
  })
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [connectionStatus, setConnectionStatus] = useState<{
    configured: boolean
    connected: boolean | null
  }>({ configured: false, connected: null })

  useEffect(() => {
    loadSettings()
    checkConnection()
  }, [])

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('olx-chat-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  const saveSettings = () => {
    localStorage.setItem('olx-chat-settings', JSON.stringify(settings))
    setStatus({
      type: 'success',
      message: 'Configurações salvas com sucesso!'
    })
  }

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/olx-chat')
      const data = await response.json()
      
      setConnectionStatus({
        configured: data.configured,
        connected: data.connectionTest?.success || false
      })
    } catch {
      setConnectionStatus({
        configured: false,
        connected: false
      })
    }
  }

  const testConnection = async () => {
    if (!settings.token) {
      setStatus({
        type: 'error',
        message: 'Configure o token primeiro'
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
          chatId: 'test',
          message: 'teste de conexão',
          token: settings.token
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Conexão testada com sucesso!'
        })
      } else {
        setStatus({
          type: 'error',
          message: data.error || 'Erro ao testar conexão'
        })
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Erro de conexão com a API'
      })
    } finally {
      setIsLoading(false)
      checkConnection()
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chat OLX
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Integração com o sistema de chat do OLX
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus.configured 
                ? connectionStatus.connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus.configured ? (
                connectionStatus.connected ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Conectado
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Token Inválido
                  </>
                )
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Não Configurado
                </>
              )}
            </div>

            <button
              onClick={checkConnection}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Atualizar status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Token de Autenticação OLX
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={settings.token}
                    onChange={(e) => setSettings({...settings, token: e.target.value})}
                    placeholder="Insira o token da API do OLX"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chat ID Padrão
                </label>
                <input
                  type="text"
                  value={settings.defaultChatId}
                  onChange={(e) => setSettings({...settings, defaultChatId: e.target.value})}
                  placeholder="ID do chat padrão (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você pode definir um Chat ID específico no widget abaixo
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveSettings}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
                
                <button
                  onClick={testConnection}
                  disabled={isLoading || !settings.token}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      Testar
                    </>
                  )}
                </button>
              </div>

              {status.type && (
                <div className={`p-3 rounded-md ${
                  status.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : status.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                  <p className="text-sm">{status.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Widget de Chat */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Widget de Chat
            </h2>
            <OLXChatWidget 
              chatId={settings.defaultChatId || undefined}
              leadName="Exemplo - João Silva"
              propertyTitle="Apartamento 2 quartos - Centro"
            />
          </div>
        </div>

        {/* Documentação */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📚 Como usar o Chat OLX
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-semibold mb-2">1. Configuração</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Obtenha o token da API OLX</li>
                <li>• Configure o token nas configurações</li>
                <li>• Teste a conexão</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Uso</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Insira o Chat ID específico</li>
                <li>• Digite a mensagem</li>
                <li>• Clique em &quot;Enviar via OLX&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useTheme } from '@/lib/theme-context'
import { 
  Building2, 
  Bell, 
  Palette, 
  DollarSign, 
  Link, 
  Shield,
  Save,
  Upload,
  Moon,
  Sun,
  Globe
} from 'lucide-react'

interface CompanySettings {
  name: string
  tradeName: string
  document: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  logo: string
  website: string
}

interface SystemSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'pt' | 'en' | 'es'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  currency: 'BRL' | 'USD' | 'EUR'
  timezone: string
}

interface NotificationSettings {
  emailEnabled: boolean
  whatsappEnabled: boolean
  contractExpiring: boolean
  paymentDue: boolean
  paymentOverdue: boolean
  daysBefore: number
}

interface FinancialSettings {
  // Configurações de Multa e Juros para Atrasos
  penaltyRate: number        // % de multa por atraso
  dailyInterestRate: number  // % de juros ao dia
  gracePeriodDays: number    // dias de carência antes de aplicar multa
  maxInterestDays: number    // máximo de dias para calcular juros
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: '',
    tradeName: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    logo: '',
    website: ''
  })

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    theme: 'light',
    language: 'pt',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    whatsappEnabled: true,
    contractExpiring: true,
    paymentDue: true,
    paymentOverdue: true,
    daysBefore: 5
  })

  const [financialSettings, setFinancialSettings] = useState<FinancialSettings>({
    // Configurações padrão para multa e juros
    penaltyRate: 2.0,          // 2% de multa
    dailyInterestRate: 0.033,  // 0.033% ao dia (1% ao mês)
    gracePeriodDays: 0,        // sem carência
    maxInterestDays: 365       // máximo 1 ano de juros
  })

  useEffect(() => {
    loadSettings()
  }, [])


  const loadSettings = async () => {
    setLoading(true)
    try {
      console.log('=== LOADING SETTINGS ===')
      const response = await fetch('/api/settings')
      console.log('Load response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received data:', data)
        
        if (data.company) {
          console.log('Loading company data:', data.company)
          setCompanySettings(prev => ({
            ...prev,
            ...data.company
          }))
        }
        if (data.system) {
          setSystemSettings(prev => ({
            ...prev,
            ...data.system
          }))
        }
        if (data.notifications) {
          setNotificationSettings(prev => ({
            ...prev,
            ...data.notifications
          }))
        }
        if (data.financial) {
          console.log('Loading financial data:', data.financial)
          setFinancialSettings(prev => ({
            ...prev,
            ...data.financial
          }))
        }
      } else {
        const errorText = await response.text()
        console.error('Load failed:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaveStatus('saving')
    try {
      console.log('=== FRONTEND SAVING ===')
      console.log('Company settings:', companySettings)
      console.log('Financial settings:', financialSettings)
      
      const payload = {
        company: companySettings,
        system: systemSettings,
        notifications: notificationSettings,
        financial: financialSettings
      }
      
      console.log('Sending payload:', payload)
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Save successful:', result)
        setSaveStatus('saved')
        // Recarregar configurações após salvar
        console.log('Reloading settings...')
        await loadSettings()
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        const errorText = await response.text()
        console.error('Save failed:', response.status, errorText)
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    
    if (numbers.length === 0) return ''
    if (numbers.length === 1) return `(${numbers}`
    if (numbers.length === 2) return `(${numbers}) `
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    } else if (numbers.length > 6) {
      if (numbers.length > 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
      } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      }
    }
    
    return numbers
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return numbers.replace(/(\d{2})(\d{0,3})/, '$1.$2')
    if (numbers.length <= 8) return numbers.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
    if (numbers.length <= 12) return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length <= 5) return numbers
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2')
  }

  const tabs = [
    { id: 'company', name: 'Empresa', icon: Building2 },
    { id: 'system', name: 'Sistema', icon: Palette },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'financial', name: 'Financeiro', icon: DollarSign },
    { id: 'integrations', name: 'Integrações', icon: Link },
    { id: 'security', name: 'Segurança', icon: Shield },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as configurações do sistema e da empresa
            </p>
          </div>
          <button 
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className={`mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              saveStatus === 'saved' 
                ? 'bg-green-600 text-white' 
                : saveStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            <Save className="w-5 h-5 mr-2" />
            {saveStatus === 'saving' && 'Salvando...'}
            {saveStatus === 'saved' && 'Salvo!'}
            {saveStatus === 'error' && 'Erro ao salvar'}
            {saveStatus === 'idle' && 'Salvar Configurações'}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'company' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informações da Empresa</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={companySettings.tradeName}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, tradeName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      value={companySettings.document}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, document: formatCNPJ(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={18}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      value={companySettings.state}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="RS">RS</option>
                      <option value="PR">PR</option>
                      <option value="SC">SC</option>
                      {/* Adicionar outros estados */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={companySettings.zipCode}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo da Empresa
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                      {companySettings.logo ? (
                        <img src={companySettings.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Upload className="w-4 h-4 mr-2" />
                      Fazer Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações do Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tema
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={theme === 'light'}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="mr-2"
                        />
                        <Sun className="w-4 h-4 mr-2" />
                        Claro
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={theme === 'dark'}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="mr-2"
                        />
                        <Moon className="w-4 h-4 mr-2" />
                        Escuro
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={theme === 'auto'}
                          onChange={(e) => setTheme(e.target.value as any)}
                          className="mr-2"
                        />
                        <Globe className="w-4 h-4 mr-2" />
                        Automático
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pt">Português (Brasil)</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formato de Data
                    </label>
                    <select
                      value={systemSettings.dateFormat}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Moeda
                    </label>
                    <select
                      value={systemSettings.currency}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BRL">Real Brasileiro (R$)</option>
                      <option value="USD">Dólar Americano ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Notificações</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por Email</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar notificações automáticas por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificações por WhatsApp</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Enviar lembretes por WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappEnabled}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, whatsappEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contratos Vencendo</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Alertar quando contratos estão próximos do vencimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.contractExpiring}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, contractExpiring: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Pagamentos Vencendo</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lembrar inquilinos sobre pagamentos próximos do vencimento</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentDue}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentDue: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Pagamentos em Atraso</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Notificar sobre pagamentos vencidos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentOverdue}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, paymentOverdue: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dias de Antecedência para Notificações
                  </label>
                  <select
                    value={notificationSettings.daysBefore}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, daysBefore: parseInt(e.target.value) }))}
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 dia</option>
                    <option value={3}>3 dias</option>
                    <option value={5}>5 dias</option>
                    <option value={7}>7 dias</option>
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Multa e Juros para Atrasos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Multa por Atraso (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={financialSettings.penaltyRate}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, penaltyRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 2.0 para 2%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Porcentagem sobre o valor do aluguel aplicada uma única vez</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Juros por Dia (%)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="10"
                      value={financialSettings.dailyInterestRate}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, dailyInterestRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 0.033 para 1% ao mês"
                    />
                    <p className="text-xs text-gray-500 mt-1">Juros aplicados diariamente sobre o valor do aluguel</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Período de Carência (dias)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={financialSettings.gracePeriodDays}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5 para 5 dias"
                    />
                    <p className="text-xs text-gray-500 mt-1">Dias após o vencimento antes de aplicar multa e juros</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Máximo de Dias para Juros
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={financialSettings.maxInterestDays}
                      onChange={(e) => setFinancialSettings(prev => ({ ...prev, maxInterestDays: parseInt(e.target.value) || 365 }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 365 para 1 ano"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo de dias para cálculo de juros (evita valores excessivos)</p>
                  </div>
                </div>

                {/* Preview dos Cálculos */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Preview de Cálculo</h5>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p>• <strong>Aluguel de R$ 1.000,00</strong> com <strong>10 dias de atraso:</strong></p>
                    {financialSettings.gracePeriodDays > 0 && (
                      <p className="ml-4 text-orange-600 dark:text-orange-300">
                        - Período de carência: {financialSettings.gracePeriodDays} dias
                      </p>
                    )}
                    {10 <= financialSettings.gracePeriodDays ? (
                      <p className="ml-4 text-green-600 dark:text-green-300">
                        - Ainda no período de carência - Sem multa nem juros
                      </p>
                    ) : (
                      <>
                        <p className="ml-4">- Dias efetivos para cobrança: {Math.max(0, 10 - financialSettings.gracePeriodDays)} dias</p>
                        <p className="ml-4">- Multa: R$ {(1000 * (financialSettings.penaltyRate / 100)).toFixed(2)}</p>
                        <p className="ml-4">- Juros: R$ {(1000 * (financialSettings.dailyInterestRate / 100) * Math.max(0, 10 - financialSettings.gracePeriodDays)).toFixed(2)}</p>
                        <p className="ml-4">- <strong>Total: R$ {(1000 + (1000 * (financialSettings.penaltyRate / 100)) + (1000 * (financialSettings.dailyInterestRate / 100) * Math.max(0, 10 - financialSettings.gracePeriodDays))).toFixed(2)}</strong></p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Integrações</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">API de Boletos</h4>
                        <p className="text-sm text-gray-500">Configurar geração automática de boletos</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Não Configurado
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">API dos Correios</h4>
                        <p className="text-sm text-gray-500">Buscar endereços por CEP automaticamente</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Configurado
                      </span>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">WhatsApp Business API</h4>
                        <p className="text-sm text-gray-500">Enviar notificações via WhatsApp</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Não Configurado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configurações de Segurança</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Política de Senhas</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Mínimo de 8 caracteres</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        <span className="text-sm">Incluir números</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Incluir caracteres especiais</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm">Expiração de senha (90 dias)</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Autenticação de Dois Fatores</h4>
                    <p className="text-sm text-gray-500 mb-3">Adicione uma camada extra de segurança</p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                      Configurar 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Sessões Ativas</h4>
                    <p className="text-sm text-gray-500 mb-3">Gerencie dispositivos conectados</p>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                      Ver Sessões
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
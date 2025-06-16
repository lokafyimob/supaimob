'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import {
  AlertTriangle,
  Users,
  Activity,
  RefreshCw,
  BarChart3,
  Brain,
  Bell
} from 'lucide-react'

interface DelinquencyStats {
  totalTenants: number
  lowRisk: number
  mediumRisk: number
  highRisk: number
  criticalRisk: number
}

interface NotificationStats {
  totalNotifications: number
  sentNotifications: number
  pendingNotifications: number
  urgentNotifications: number
  typeBreakdown: Record<string, number>
}

interface RecentAlert {
  id: string
  tenantName: string
  propertyTitle: string
  riskLevel: string
  probability: number
  createdAt: string
  priority: string
}

export default function Analytics() {
  const [delinquencyData, setDelinquencyData] = useState<{
    stats: DelinquencyStats
    recentNotifications: RecentAlert[]
  } | null>(null)
  const [notificationData, setNotificationData] = useState<{
    summary: NotificationStats
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      const [delinquencyRes, notificationRes] = await Promise.all([
        fetch('/api/analytics/delinquency', { method: 'GET' }),
        fetch('/api/notifications/automated', { method: 'GET' })
      ])

      if (delinquencyRes.ok) {
        const delinquencyResult = await delinquencyRes.json()
        if (delinquencyResult.success) {
          setDelinquencyData(delinquencyResult.data)
        }
      }

      if (notificationRes.ok) {
        const notificationResult = await notificationRes.json()
        if (notificationResult.success) {
          setNotificationData(notificationResult.data)
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const runDelinquencyAnalysis = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/analytics/delinquency', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Recarregar dados após análise
          await fetchAnalytics()
          alert(`Análise concluída! ${result.data.analyzedTenants} inquilinos analisados, ${result.data.alertsSent} alertas enviados.`)
        }
      }
    } catch (error) {
      console.error('Error running analysis:', error)
      alert('Erro ao executar análise')
    } finally {
      setAnalyzing(false)
    }
  }

  const sendAutomatedNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/automated', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await fetchAnalytics()
          alert(`Notificações enviadas! ${result.data.sent} enviadas com sucesso.`)
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      alert('Erro ao enviar notificações')
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const totalRisk = delinquencyData?.stats ? 
    delinquencyData.stats.highRisk + delinquencyData.stats.criticalRisk : 0
  const riskPercentage = delinquencyData?.stats && delinquencyData.stats.totalTenants > 0 ? 
    (totalRisk / delinquencyData.stats.totalTenants * 100).toFixed(1) : '0'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics e IA</h1>
              <p className="text-gray-600 mt-1">
                Análise inteligente de inadimplência e sistema de alertas
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={runDelinquencyAnalysis}
                disabled={analyzing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {analyzing ? 'Analisando...' : 'Executar Análise IA'}
              </button>
              <button
                onClick={sendAutomatedNotifications}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Enviar Notificações
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inquilinos Analisados</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {delinquencyData?.stats?.totalTenants || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">Total no sistema</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alto Risco</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {totalRisk}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium text-red-600">{riskPercentage}%</span>
              <span className="text-gray-500 text-sm ml-2">do total</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notificações Enviadas</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {notificationData?.summary?.sentNotifications || 0}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">Últimos 7 dias</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Urgentes</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {notificationData?.summary?.urgentNotifications || 0}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500">Requer atenção</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Distribuição de Risco
            </h2>
            {delinquencyData?.stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">Baixo Risco</span>
                  <span className="text-sm font-bold">{delinquencyData.stats.lowRisk}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(delinquencyData.stats.lowRisk / delinquencyData.stats.totalTenants) * 100}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-600">Médio Risco</span>
                  <span className="text-sm font-bold">{delinquencyData.stats.mediumRisk}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(delinquencyData.stats.mediumRisk / delinquencyData.stats.totalTenants) * 100}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-600">Alto Risco</span>
                  <span className="text-sm font-bold">{delinquencyData.stats.highRisk}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(delinquencyData.stats.highRisk / delinquencyData.stats.totalTenants) * 100}%` 
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Risco Crítico</span>
                  <span className="text-sm font-bold">{delinquencyData.stats.criticalRisk}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(delinquencyData.stats.criticalRisk / delinquencyData.stats.totalTenants) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Nenhum dado disponível</p>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Alertas Recentes de IA
            </h2>
            <div className="space-y-4">
              {delinquencyData?.recentNotifications?.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    alert.riskLevel === 'CRITICAL' ? 'bg-red-100' :
                    alert.riskLevel === 'HIGH' ? 'bg-orange-100' :
                    'bg-yellow-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.riskLevel === 'CRITICAL' ? 'text-red-600' :
                      alert.riskLevel === 'HIGH' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.tenantName} - {alert.propertyTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Risco {alert.riskLevel} ({alert.probability}% probabilidade)
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-sm">Nenhum alerta recente</p>
              )}
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tipos de Notificações (Últimos 7 dias)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {notificationData?.summary?.typeBreakdown && Object.entries(notificationData.summary.typeBreakdown).map(([type, count]) => (
              <div key={type} className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{count}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import {
  Building2,
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react'

interface Stats {
  properties: number
  owners: number
  tenants: number
  activeContracts: number
}

const statsConfig = [
  {
    name: 'Total de Imóveis',
    key: 'properties',
    icon: Building2
  },
  {
    name: 'Proprietários',
    key: 'owners',
    icon: Users
  },
  {
    name: 'Inquilinos',
    key: 'tenants',
    icon: UserCheck
  },
  {
    name: 'Contratos Ativos',
    key: 'activeContracts',
    icon: FileText
  }
]

const recentActivities = [
  {
    id: 1,
    type: 'contract',
    message: 'Novo contrato assinado para Apartamento no Centro',
    time: '2 horas atrás',
    icon: FileText
  },
  {
    id: 2,
    type: 'payment',
    message: 'Pagamento recebido de João Silva - R$ 2.500,00',
    time: '4 horas atrás',
    icon: DollarSign
  },
  {
    id: 3,
    type: 'property',
    message: 'Nova propriedade cadastrada na Rua das Flores',
    time: '1 dia atrás',
    icon: Building2
  },
  {
    id: 4,
    type: 'alert',
    message: 'Alerta: 3 pagamentos em atraso detectados',
    time: '2 dias atrás',
    icon: AlertTriangle
  }
]

const upcomingTasks = [
  {
    id: 1,
    task: 'Renovar contrato - Apartamento Centro',
    date: '2024-01-15',
    priority: 'high'
  },
  {
    id: 2,
    task: 'Vistoria técnica - Casa Jardim América',
    date: '2024-01-18',
    priority: 'medium'
  },
  {
    id: 3,
    task: 'Reunião com proprietário - Sala comercial',
    date: '2024-01-20',
    priority: 'low'
  }
]

export default function Dashboard() {
  const { data: _session } = useSession()
  const [stats, setStats] = useState<Stats>({
    properties: 0,
    owners: 0,
    tenants: 0,
    activeContracts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        const [propertiesRes, ownersRes, tenantsRes, contractsRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/owners'),
          fetch('/api/tenants'),
          fetch('/api/contracts')
        ])

        const [properties, owners, tenants, contracts] = await Promise.all([
          propertiesRes.json(),
          ownersRes.json(),
          tenantsRes.json(),
          contractsRes.json()
        ])

        setStats({
          properties: properties.length || 0,
          owners: owners.length || 0,
          tenants: tenants.length || 0,
          activeContracts: contracts.filter((c: { status: string }) => c.status === 'ACTIVE').length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <p className="text-gray-600">
            Aqui está um resumo das suas atividades hoje
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((statConfig) => {
            const Icon = statConfig.icon
            const value = stats[statConfig.key as keyof Stats]
            
            return (
              <div key={statConfig.name} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{statConfig.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
                      ) : (
                        value.toLocaleString()
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                    <Icon className="w-6 h-6" style={{color: '#ff4352'}} />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Atualizado agora
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Atividades Recentes
            </h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Próximas Tarefas
            </h2>
            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {task.task}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.priority === 'high' ? 'Alta' : 
                     task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building2 className="w-8 h-8 mb-2" style={{color: '#ff4352'}} />
              <span className="text-sm font-medium text-gray-900">Novo Imóvel</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Novo Proprietário</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Novo Contrato</span>
            </button>
            <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Relatórios</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
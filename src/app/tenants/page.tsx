'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { TenantForm } from '@/components/tenant-form'
import { Plus, Search, Mail, Phone, MapPin, DollarSign, Edit, Trash2, UserCheck, AlertTriangle } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  document: string
  address: string
  city: string
  state: string
  zipCode: string
  income: number
  occupation?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  } | null
  contracts: Array<{
    id: string
    startDate: string
    endDate: string
    status: string
    property: {
      title: string
    }
  }>
}

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        setTenants(data)
      } else {
        const errorData = await response.json()
        console.error('Error fetching tenants:', errorData)
        // Se for erro de autenticação, redireciona para login
        if (response.status === 401) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (data: any) => {
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const newTenant = await response.json()
        // Adiciona o novo inquilino à lista existente para atualização imediata
        setTenants(prev => [newTenant, ...prev])
        setShowForm(false)
        // Recarrega os dados para garantir consistência
        await fetchTenants()
      } else {
        const errorData = await response.json()
        console.error('Error creating tenant:', errorData)
        alert('Erro ao criar inquilino: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      alert('Erro ao criar inquilino. Verifique sua conexão.')
    }
  }

  const handleEditTenant = async (data: any) => {
    if (!editingTenant) return

    try {
      const response = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updatedTenant = await response.json()
        // Atualiza o inquilino na lista existente
        setTenants(prev => prev.map(tenant => 
          tenant.id === editingTenant.id ? updatedTenant : tenant
        ))
        setShowForm(false)
        setEditingTenant(null)
        // Recarrega os dados para garantir consistência
        await fetchTenants()
      } else {
        const errorData = await response.json()
        console.error('Error updating tenant:', errorData)
        alert('Erro ao atualizar inquilino: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
      alert('Erro ao atualizar inquilino. Verifique sua conexão.')
    }
  }

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este inquilino?')) return

    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove o inquilino da lista existente para atualização imediata
        setTenants(prev => prev.filter(tenant => tenant.id !== id))
        // Recarrega os dados para garantir consistência
        await fetchTenants()
      } else {
        const errorData = await response.json()
        console.error('Error deleting tenant:', errorData)
        alert('Erro ao deletar inquilino: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
      alert('Erro ao deletar inquilino. Verifique sua conexão.')
    }
  }

  const openEditForm = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingTenant(null)
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.document.includes(searchTerm)
  )

  const formatPhoneDisplay = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    
    return phone // Retorna como está se não conseguir formatar
  }

  const getTenantStatus = (tenant: Tenant) => {
    const activeContracts = tenant.contracts.filter(c => c.status === 'ACTIVE')
    if (activeContracts.length > 0) {
      return { status: 'active', text: 'Ativo', color: 'bg-green-100 text-green-800' }
    }
    return { status: 'inactive', text: 'Inativo', color: 'bg-gray-100 text-gray-800' }
  }

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.contracts.some(c => c.status === 'ACTIVE')).length,
    inactive: tenants.filter(t => !t.contracts.some(c => c.status === 'ACTIVE')).length,
    averageIncome: tenants.reduce((sum, t) => sum + t.income, 0) / tenants.length || 0
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Inquilinos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os inquilinos e locatários
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Inquilino
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Inquilinos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inquilinos Ativos</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.active}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sem Contrato</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">{stats.inactive}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Renda Média</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.averageIncome.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar inquilinos por nome, email ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTenants.map((tenant) => {
            const status = getTenantStatus(tenant)
            return (
              <div key={tenant.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">Doc: {tenant.document}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      {status.text}
                    </span>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => openEditForm(tenant)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar inquilino"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar inquilino"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-3" />
                    <span className="text-sm">{tenant.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-3" />
                    <span className="text-sm">{formatPhoneDisplay(tenant.phone)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-3" />
                    <span className="text-sm">{tenant.address}, {tenant.city} - {tenant.state}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-3" />
                    <span className="text-sm">Renda: R$ {tenant.income.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {tenant.contracts.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Contratos Ativos</h4>
                    {tenant.contracts.map((contract) => (
                      <div key={contract.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">
                          {contract.property.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(contract.startDate).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {tenant.contracts.length === 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-center py-4 text-gray-500">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span className="text-sm">Nenhum contrato ativo</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Ver Histórico
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                    Novo Contrato
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum inquilino encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.' 
                : 'Comece adicionando um novo inquilino ao sistema.'}
            </p>
          </div>
        )}

        {/* Tenant Form Modal */}
        <TenantForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingTenant ? handleEditTenant : handleCreateTenant}
          tenant={editingTenant}
        />
      </div>
    </DashboardLayout>
  )
}
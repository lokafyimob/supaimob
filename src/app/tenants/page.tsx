'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { TenantForm } from '@/components/tenant-form'
import { ToastContainer, useToast } from '@/components/toast'
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
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

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
        setTenants(prev => [newTenant, ...prev])
        setShowForm(false)
        await fetchTenants()
        showSuccess('Inquilino criado!', 'O inquilino foi cadastrado com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao criar inquilino', errorData.error || 'Tente novamente.')
        console.error('Error creating tenant:', errorData)
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
      showError('Erro ao criar inquilino', 'Verifique sua conexão e tente novamente.')
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
        setTenants(prev => prev.map(tenant => 
          tenant.id === editingTenant.id ? updatedTenant : tenant
        ))
        setShowForm(false)
        setEditingTenant(null)
        await fetchTenants()
        showSuccess('Inquilino atualizado!', 'As informações foram atualizadas com sucesso.')
      } else {
        const errorData = await response.json()
        console.error('Error updating tenant:', errorData)
        showError('Erro ao atualizar inquilino', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
      showError('Erro ao atualizar inquilino', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este inquilino?')) return

    try {
      const response = await fetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTenants(prev => prev.filter(tenant => tenant.id !== id))
        await fetchTenants()
        showSuccess('Inquilino excluído!', 'O inquilino foi removido com sucesso.')
      } else {
        const errorData = await response.json()
        console.error('Error deleting tenant:', errorData)
        showError('Erro ao excluir inquilino', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
      showError('Erro ao excluir inquilino', 'Verifique sua conexão e tente novamente.')
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#ff4352'}}></div>
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
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            style={{backgroundColor: '#ff4352'}}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#e03e4d'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#ff4352'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Inquilino
          </button>
        </div>

        {/* Stats - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Inquilino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Renda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contratos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTenants.map((tenant) => {
                  const status = getTenantStatus(tenant)
                  return (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                            <UserCheck className="w-5 h-5" style={{color: '#ff4352'}} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{tenant.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Doc: {tenant.document}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center mb-1">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {tenant.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {formatPhoneDisplay(tenant.phone)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <div>{tenant.address}</div>
                              <div className="text-gray-500 dark:text-gray-400">{tenant.city} - {tenant.state}</div>
                              <div className="text-gray-500 dark:text-gray-400">CEP: {tenant.zipCode}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white font-medium">
                            R$ {tenant.income.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {tenant.occupation && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {tenant.occupation}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tenant.contracts.length > 0 ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {tenant.contracts.map((contract) => (
                              <div key={contract.id} className="mb-2 last:mb-0">
                                <div className="font-medium">{contract.property.title}</div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs">
                                  {new Date(contract.startDate).toLocaleDateString('pt-BR')} até{' '}
                                  {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500 dark:text-gray-400">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span className="text-sm">Sem contratos</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => openEditForm(tenant)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            style={{color: '#ff4352'}}
                            title="Editar inquilino"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Deletar inquilino"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredTenants.map((tenant) => {
            const status = getTenantStatus(tenant)
            return (
              <div key={tenant.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <UserCheck className="w-5 h-5" style={{color: '#ff4352'}} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{tenant.name}</h3>
                      <p className="text-xs text-gray-500">Doc: {tenant.document}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="text-sm">{tenant.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span className="text-sm">{formatPhoneDisplay(tenant.phone)}</span>
                  </div>
                  <div className="flex items-start text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{tenant.address}, {tenant.city} - {tenant.state}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span className="text-sm">Renda: R$ {tenant.income.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {tenant.contracts.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-1">Contratos:</h4>
                    {tenant.contracts.map((contract) => (
                      <div key={contract.id} className="bg-gray-50 rounded p-2 mb-1 last:mb-0">
                        <p className="text-xs font-medium text-gray-900">
                          {contract.property.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(contract.startDate).toLocaleDateString('pt-BR')} aé {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {tenant.contracts.length === 0 && (
                  <div className="mb-3 flex items-center justify-center py-2 text-gray-500">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    <span className="text-xs">Sem contratos</span>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => openEditForm(tenant)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{color: '#ff4352'}}
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

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  )
}
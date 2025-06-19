'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { OwnerForm } from '@/components/owner-form'
import { ConfirmationModal } from '@/components/confirmation-modal'
import { ToastContainer, useToast } from '@/components/toast'
import { Plus, Search, Mail, Phone, MapPin, Building2, Edit, Trash2, User } from 'lucide-react'

interface Owner {
  id: string
  name: string
  email: string
  phone: string
  document: string
  address: string
  city: string
  state: string
  zipCode: string
  properties: any[]
  bankAccount: {
    bankName: string
    accountType: string
    agency: string
    account: string
    pixKey?: string
  } | null
}

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; owner: Owner | null; loading: boolean }>({
    isOpen: false,
    owner: null,
    loading: false
  })
  const [hasApiError, setHasApiError] = useState(false)
  
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()

  useEffect(() => {
    fetchOwners()
  }, [])

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/owners')
      if (response.ok) {
        const data = await response.json()
        setOwners(Array.isArray(data) ? data : [])
        setHasApiError(false)
      } else {
        console.error('Error fetching owners:', response.status)
        setOwners([])
        setHasApiError(true)
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
      setOwners([])
      setHasApiError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOwner = async (data: any) => {
    try {
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchOwners()
        setShowForm(false)
        showSuccess('Proprietário criado!', 'O proprietário foi cadastrado com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao criar proprietário', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error creating owner:', error)
      showError('Erro ao criar proprietário', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleEditOwner = async (data: any) => {
    if (!editingOwner) return

    try {
      const response = await fetch(`/api/owners/${editingOwner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchOwners()
        setShowForm(false)
        setEditingOwner(null)
        showSuccess('Proprietário atualizado!', 'As informações foram atualizadas com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao atualizar proprietário', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error updating owner:', error)
      showError('Erro ao atualizar proprietário', 'Verifique sua conexão e tente novamente.')
    }
  }

  const openDeleteModal = (owner: Owner) => {
    setDeleteModal({ isOpen: true, owner, loading: false })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, owner: null, loading: false })
  }

  const handleDeleteOwner = async () => {
    if (!deleteModal.owner) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/owners/${deleteModal.owner.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchOwners()
        closeDeleteModal()
        showSuccess('Proprietário excluído!', 'O proprietário foi removido com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao excluir proprietário', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error deleting owner:', error)
      showError('Erro ao excluir proprietário', 'Verifique sua conexão e tente novamente.')
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const openEditForm = (owner: Owner) => {
    setEditingOwner(owner)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingOwner(null)
  }


  const filteredOwners = owners.filter(owner =>
    owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.document.includes(searchTerm)
  )

  // console.log('Current state - owners:', owners.length, 'filtered:', filteredOwners.length, 'loading:', loading)

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
            <h1 className="text-2xl font-bold text-gray-900">Proprietários</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os proprietários de imóveis
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
            Novo Proprietário
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proprietários por nome, email ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              onFocus={(e) => {
                const target = e.target as HTMLInputElement
                target.style.borderColor = '#ff4352'
                target.style.boxShadow = '0 0 0 2px rgba(255, 67, 82, 0.2)'
              }}
              onBlur={(e) => {
                const target = e.target as HTMLInputElement
                target.style.borderColor = '#d1d5db'
                target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Stats - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Proprietários</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{owners.length}</p>
              </div>
              <div className="p-3 rounded-lg" style={{backgroundColor: '#fef2f2'}}>
                <User className="w-6 h-6" style={{color: '#ff4352'}} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Imóveis</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {owners.reduce((sum, owner) => sum + (owner.properties?.length || 0), 0)}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Com Conta Bancária</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {owners.filter(owner => owner.bankAccount).length}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Proprietário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Imóveis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Dados Bancários
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
                {filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                          <User className="w-5 h-5" style={{color: '#ff4352'}} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{owner.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID: {owner.document}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center mb-1">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {owner.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {owner.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div>{owner.address}</div>
                            <div className="text-gray-500 dark:text-gray-400">{owner.city} - {owner.state}</div>
                            <div className="text-gray-500 dark:text-gray-400">CEP: {owner.zipCode}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white font-medium">
                          {owner.properties?.length || 0} imóvel(is)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {owner.bankAccount ? (
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium">{owner.bankAccount.bankName}</div>
                          <div className="text-gray-500 dark:text-gray-400">{owner.bankAccount.accountType}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            Ag: {owner.bankAccount.agency} | Conta: {owner.bankAccount.account}
                          </div>
                          {owner.bankAccount.pixKey && (
                            <div className="text-gray-500 dark:text-gray-400">PIX: {owner.bankAccount.pixKey}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Não informado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        owner.bankAccount 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {owner.bankAccount ? 'Completo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => openEditForm(owner)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          style={{color: '#ff4352'}}
                          title="Editar proprietário"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(owner)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Deletar proprietário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredOwners.map((owner) => (
            <div key={owner.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                    <User className="w-5 h-5" style={{color: '#ff4352'}} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{owner.name}</h3>
                    <p className="text-xs text-gray-500">ID: {owner.document}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  owner.bankAccount 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {owner.bankAccount ? 'Completo' : 'Pendente'}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">{owner.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">{owner.phone}</span>
                </div>
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{owner.address}, {owner.city} - {owner.state}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="text-sm">{owner.properties?.length || 0} imóvel(is)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {owner.bankAccount ? (
                    <span>{owner.bankAccount.bankName} - {owner.bankAccount.accountType}</span>
                  ) : (
                    <span>Dados bancários pendentes</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditForm(owner)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    style={{color: '#ff4352'}}
                    title="Editar proprietário"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(owner)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Deletar proprietário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOwners.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum proprietário encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.' 
                : 'Comece adicionando um novo proprietário ao sistema.'}
            </p>
          </div>
        )}

        {/* Owner Form Modal */}
        <OwnerForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingOwner ? handleEditOwner : handleCreateOwner}
          owner={editingOwner}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteOwner}
          title="Excluir Proprietário"
          message={`Tem certeza que deseja excluir "${deleteModal.owner?.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`}
          type="delete"
          confirmText="Sim, Excluir"
          cancelText="Cancelar"
          loading={deleteModal.loading}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  )
}
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
  const [migrationLoading, setMigrationLoading] = useState(false)
  
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
      } else {
        console.error('Error fetching owners:', response.status)
        setOwners([])
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
      setOwners([])
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

  const runMigration = async () => {
    setMigrationLoading(true)
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        showSuccess('Migração concluída!', `${data.results?.length || 0} operações executadas`)
        // Recarregar a lista de owners após migração
        await fetchOwners()
      } else {
        showError('Erro na migração', data.error || 'Tente novamente')
      }
    } catch (error) {
      showError('Erro na migração', 'Verifique sua conexão e tente novamente')
    } finally {
      setMigrationLoading(false)
    }
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Migration Alert */}
        {owners.length === 0 && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-semibold">Banco de dados precisa ser corrigido</h3>
                <p className="text-yellow-700 mt-1">
                  Se você está vendo erros ao criar proprietários, clique no botão "Corrigir BD" para atualizar o banco de dados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proprietários</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os proprietários de imóveis
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button 
              onClick={runMigration}
              disabled={migrationLoading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {migrationLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Migrando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Corrigir BD
                </>
              )}
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Proprietário
            </button>
          </div>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Proprietários</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{owners.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
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

        {/* Owners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOwners.map((owner) => (
            <div key={owner.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{owner.name}</h3>
                    <p className="text-sm text-gray-500">ID: {owner.document}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditForm(owner)}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Editar proprietário"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openDeleteModal(owner)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                    title="Deletar proprietário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-3" />
                  <span className="text-sm">{owner.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-3" />
                  <span className="text-sm">{owner.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-3" />
                  <span className="text-sm">{owner.address}, {owner.city} - {owner.state}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Building2 className="w-4 h-4 mr-3" />
                  <span className="text-sm">{owner.properties?.length || 0} imóvel(is)</span>
                </div>
              </div>

              {owner.bankAccount && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Dados Bancários</p>
                  <p className="text-sm text-gray-600">
                    {owner.bankAccount.bankName} - {owner.bankAccount.accountType}
                  </p>
                  <p className="text-sm text-gray-600">
                    Ag: {owner.bankAccount.agency} | Conta: {owner.bankAccount.account}
                  </p>
                  {owner.bankAccount.pixKey && (
                    <p className="text-sm text-gray-600">PIX: {owner.bankAccount.pixKey}</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  owner.bankAccount 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {owner.bankAccount ? 'Dados Completos' : 'Pendente Dados Bancários'}
                </span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver Detalhes
                </button>
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
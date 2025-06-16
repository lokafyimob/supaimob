'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ContractForm } from '@/components/contract-form'
import { AIContractForm } from '@/components/ai-contract-form'
import { ContractMaintenances } from '@/components/contract-maintenances'
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  User,
  Building2,
  Edit,
  Eye,
  Download,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface Contract {
  id: string
  startDate: string
  endDate: string
  rentAmount: number
  depositAmount: number
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  terms?: string
  property: {
    id: string
    title: string
    address: string
    propertyType: string
    owner: {
      id: string
      name: string
      email: string
    }
  }
  tenant: {
    id: string
    name: string
    email: string
    phone: string
  }
  payments: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
  }>
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [showContractDetails, setShowContractDetails] = useState(false)
  const [viewingContract, setViewingContract] = useState<Contract | null>(null)
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    fetchContracts()
    
    // Listen for payment updates from other components
    const handlePaymentUpdate = () => {
      fetchContracts()
    }
    
    window.addEventListener('paymentUpdated', handlePaymentUpdate)
    
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdate)
    }
  }, [])

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContract = async (data: any) => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchContracts()
        setShowForm(false)
        showNotification('success', 'Contrato criado com sucesso!')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao criar contrato')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      showNotification('error', 'Erro ao criar contrato')
    }
  }

  const handleEditContract = async (data: any) => {
    if (!editingContract) return

    try {
      const response = await fetch(`/api/contracts/${editingContract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchContracts()
        setShowForm(false)
        setEditingContract(null)
        showNotification('success', 'Contrato atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao atualizar contrato')
      }
    } catch (error) {
      console.error('Error updating contract:', error)
      showNotification('error', 'Erro ao atualizar contrato')
    }
  }

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este contrato?')) return

    try {
      setDeletingContractId(id)
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchContracts()
        showNotification('success', 'Contrato excluído com sucesso!')
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao excluir contrato')
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      showNotification('error', 'Erro ao excluir contrato')
    } finally {
      setDeletingContractId(null)
    }
  }

  const openEditForm = (contract: Contract) => {
    setEditingContract(contract)
    setShowForm(true)
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingContract(null)
  }

  const downloadContract = (contract: Contract) => {
    if (!contract.terms) {
      alert('Este contrato não possui termos disponíveis para download.')
      return
    }

    // Format contract content
    const contractContent = `
CONTRATO DE LOCAÇÃO

Contrato: ${contract.id}
Imóvel: ${contract.property.title}
Endereço: ${contract.property.address}
Inquilino: ${contract.tenant.name}
Proprietário: ${contract.property.owner.name}
Período: ${formatDate(contract.startDate)} até ${formatDate(contract.endDate)}
Valor do Aluguel: R$ ${contract.rentAmount.toLocaleString('pt-BR')}
Valor do Depósito: R$ ${contract.depositAmount.toLocaleString('pt-BR')}

=====================================

${contract.terms}

=====================================

Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Sistema: CRM Imobiliário
    `.trim()

    // Create and download file
    const blob = new Blob([contractContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contrato-${contract.property.title.replace(/[^a-zA-Z0-9]/g, '-')}-${contract.tenant.name.replace(/[^a-zA-Z0-9]/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const viewContractDetails = (contract: Contract) => {
    setViewingContract(contract)
    setShowContractDetails(true)
  }

  const closeContractDetails = () => {
    setShowContractDetails(false)
    setViewingContract(null)
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'EXPIRED':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'RENEWED':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'EXPIRED':
        return 'Expirado'
      case 'CANCELLED':
        return 'Cancelado'
      case 'RENEWED':
        return 'Renovado'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'RENEWED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Apartamento'
      case 'HOUSE':
        return 'Casa'
      case 'COMMERCIAL':
        return 'Comercial'
      case 'LAND':
        return 'Terreno'
      case 'STUDIO':
        return 'Studio'
      default:
        return type
    }
  }

  // Função helper para formatar datas de forma segura
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Data não informada'
    
    console.log('📅 Formatando data:', dateInput, 'Type:', typeof dateInput)
    
    try {
      let date: Date
      
      // Se já é um objeto Date
      if (dateInput instanceof Date) {
        date = dateInput
      }
      // Se é string
      else if (typeof dateInput === 'string') {
        // Se já tem horário, usar como está
        if (dateInput.includes('T')) {
          date = new Date(dateInput)
        } else {
          // Se é só data (YYYY-MM-DD), adicionar horário
          date = new Date(dateInput + 'T00:00:00')
        }
      }
      // Tentar converter qualquer outro tipo
      else {
        date = new Date(dateInput as string)
      }
      
      // Verificar se é uma data válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateInput)
        return 'Data inválida'
      }
      
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar data:', dateInput, error)
      return 'Data inválida'
    }
  }

  const getDaysUntilExpiration = (endDate: string | Date) => {
    if (!endDate) return 0
    
    try {
      const today = new Date()
      let expiration: Date
      
      if (endDate instanceof Date) {
        expiration = endDate
      } else if (typeof endDate === 'string') {
        expiration = endDate.includes('T') ? new Date(endDate) : new Date(endDate + 'T00:00:00')
      } else {
        expiration = new Date(endDate as string)
      }
      
      if (isNaN(expiration.getTime())) return 0
      
      const diffTime = expiration.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (error) {
      console.error('Erro ao calcular dias até expiração:', endDate, error)
      return 0
    }
  }

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'ACTIVE').length,
    expiring: contracts.filter(c => {
      const days = getDaysUntilExpiration(c.endDate)
      return days <= 30 && days > 0 && c.status === 'ACTIVE'
    }).length,
    totalValue: contracts
      .filter(c => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + c.rentAmount, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os contratos de locação
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button 
              onClick={fetchContracts}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              title="Atualizar dados"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowAIGenerator(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Bot className="w-5 h-5 mr-2" />
              Gerar com IA
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Contrato
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.active}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencendo em 30 dias</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">{stats.expiring}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total Mensal</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.totalValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por inquilino, imóvel ou proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="ACTIVE">Ativo</option>
                <option value="EXPIRED">Expirado</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="RENEWED">Renovado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredContracts.map((contract) => {
            const daysUntilExpiration = getDaysUntilExpiration(contract.endDate)
            const isExpiringSoon = daysUntilExpiration <= 30 && daysUntilExpiration > 0
            
            return (
              <div key={contract.id} className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] ${
                deletingContractId === contract.id ? 'opacity-60 bg-red-50' : ''
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {contract.property.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Contrato #{contract.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(contract.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                      {getStatusText(contract.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-3" />
                    <div>
                      <span className="text-sm font-medium">Inquilino: </span>
                      <span className="text-sm">{contract.tenant.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-4 h-4 mr-3" />
                    <div>
                      <span className="text-sm">{getPropertyTypeText(contract.property.propertyType)}</span>
                      <span className="text-xs text-gray-500 ml-2">{contract.property.address}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-3" />
                    <span className="text-sm">
                      {formatDate(contract.startDate)} até {formatDate(contract.endDate)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Valor do Aluguel</p>
                    <p className="text-lg font-bold text-gray-900">
                      R$ {contract.rentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Depósito</p>
                    <p className="text-lg font-bold text-gray-900">
                      R$ {contract.depositAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {isExpiringSoon && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        Vence em {daysUntilExpiration} dias
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => viewContractDetails(contract)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => downloadContract(contract)}
                      className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      title="Baixar contrato"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditForm(contract)}
                      className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      title="Editar contrato"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract.id)}
                      disabled={deletingContractId === contract.id}
                      className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 ${
                        deletingContractId === contract.id ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
                      }`}
                      title="Excluir contrato"
                    >
                      {deletingContractId === contract.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button 
                    onClick={() => viewContractDetails(contract)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo contrato ou use a IA para gerar automaticamente.'}
            </p>
          </div>
        )}

        {/* AI Contract Generator Modal */}
        <AIContractForm
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          onSuccess={() => {
            fetchContracts()
            setShowAIGenerator(false)
          }}
        />

        {/* Contract Form Modal */}
        <ContractForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingContract ? handleEditContract : handleCreateContract}
          contract={editingContract}
        />

        {/* Contract Details Modal */}
        {showContractDetails && viewingContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalhes do Contrato
                </h2>
                <button
                  onClick={closeContractDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Contract Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Informações do Contrato</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">ID:</span> {viewingContract.id}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingContract.status)}`}>
                          {getStatusText(viewingContract.status)}
                        </span>
                      </p>
                      <p><span className="font-medium">Período:</span> {new Date(viewingContract.startDate).toLocaleDateString('pt-BR')} até {new Date(viewingContract.endDate).toLocaleDateString('pt-BR')}</p>
                      <p><span className="font-medium">Valor do Aluguel:</span> R$ {viewingContract.rentAmount.toLocaleString('pt-BR')}</p>
                      <p><span className="font-medium">Depósito:</span> R$ {viewingContract.depositAmount.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Partes Envolvidas</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-600">Proprietário</p>
                        <p>{viewingContract.property.owner.name}</p>
                        <p className="text-sm text-gray-500">{viewingContract.property.owner.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-600">Inquilino</p>
                        <p>{viewingContract.tenant.name}</p>
                        <p className="text-sm text-gray-500">{viewingContract.tenant.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Imóvel</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium">{viewingContract.property.title}</h4>
                    <p className="text-gray-600">{viewingContract.property.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getPropertyTypeText(viewingContract.property.propertyType)}
                    </p>
                  </div>
                </div>

                {/* Contract Terms */}
                {viewingContract.terms && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Termos do Contrato</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                        {viewingContract.terms}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Maintenances Section */}
                <ContractMaintenances 
                  contractId={viewingContract.id}
                  propertyId={viewingContract.property.id}
                  contract={viewingContract}
                />

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => downloadContract(viewingContract)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Baixar Contrato
                  </button>
                  <button
                    onClick={() => {
                      closeContractDetails()
                      openEditForm(viewingContract)
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Contrato
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right ${
              notification.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full transition-all duration-5000 ease-linear"
                style={{ 
                  width: '100%',
                  animation: 'shrink 5s linear forwards'
                }}
              />
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
          @keyframes animate-in {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-in {
            animation: animate-in 0.3s ease-out;
          }
          .slide-in-from-right {
            animation: animate-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}
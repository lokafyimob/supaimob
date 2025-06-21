'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  X,
  FileText,
  Download
} from 'lucide-react'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [includeInterest, setIncludeInterest] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState(null)
  const [showAllMonths, setShowAllMonths] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [allPayments, setAllPayments] = useState([])
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        
        // Mapear os dados para o formato esperado pelo frontend
        const mappedPayments = data.map(payment => ({
          ...payment,
          property: payment.contract?.property || {},
          tenant: payment.contract?.tenant || {}
        }))
        
        console.log('Payments received:', data.length)
        console.log('Mapped payments:', mappedPayments.length)
        if (mappedPayments.length > 0) {
          console.log('First payment:', mappedPayments[0])
        }
        
        setPayments(mappedPayments)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPaymentsByTenant = async (tenantName) => {
    try {
      const response = await fetch('/api/payments/all-months')
      if (response.ok) {
        const data = await response.json()
        
        // Mapear e filtrar por inquilino
        const mappedPayments = data.map(payment => ({
          ...payment,
          property: payment.contract?.property || {},
          tenant: payment.contract?.tenant || {}
        })).filter(payment => payment.tenant.name === tenantName)
        
        setAllPayments(mappedPayments)
      }
    } catch (error) {
      console.error('Erro ao carregar todos os pagamentos:', error)
    }
  }

  const handleTenantClick = async (tenantName) => {
    if (!tenantName) return
    
    setSelectedTenant(tenantName)
    setShowAllMonths(true)
    await fetchAllPaymentsByTenant(tenantName)
  }


  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Apenas arquivos JPG, PNG ou PDF são permitidos')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 5MB')
        return
      }
      
      setUploadedFile(file)
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setUploadedFileUrl(url)
      } else {
        setUploadedFileUrl('')
      }
    }
  }

  const removeUploadedFile = () => {
    if (uploadedFileUrl) {
      URL.revokeObjectURL(uploadedFileUrl)
    }
    setUploadedFile(null)
    setUploadedFileUrl('')
  }

  const viewReceipt = (payment) => {
    setViewingReceipt(payment)
    setShowReceiptModal(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedPayment || processingPayment) return

    setProcessingPayment(true)
    try {
      let receiptUrl = ''
      
      // Use the actual uploaded file URL for preview
      if (uploadedFile) {
        receiptUrl = uploadedFileUrl || URL.createObjectURL(uploadedFile)
      }

      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          paymentMethod,
          notes,
          includeInterest,
          receiptUrl
        })
      })

      if (response.ok) {
        // Refresh payments from API
        await fetchPayments()
        
        // Se estiver no histórico, também atualizar os pagamentos do histórico
        if (showAllMonths && selectedTenant) {
          await fetchAllPaymentsByTenant(selectedTenant)
        }
        
        setShowModal(false)
        setSelectedPayment(null)
        setNotes('')
        setPaymentMethod('dinheiro')
        setIncludeInterest(true)
        
        // Don't revoke the URL since it's now being used by the payment
        setUploadedFile(null)
        setUploadedFileUrl('')
        
        // Reabrir o histórico se havia um inquilino selecionado
        if (selectedTenant) {
          setShowAllMonths(true)
        }
        
        alert('Pagamento marcado como pago!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Erro ao marcar pagamento como pago')
      }
      
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error)
      alert('Erro ao processar pagamento')
    } finally {
      setProcessingPayment(false)
    }
  }

  const calculateTotal = (payment) => {
    if (!payment || !payment.amount) return 0
    if (!includeInterest) return payment.amount

    const today = new Date()
    const dueDate = new Date(payment.dueDate)
    
    if (today <= dueDate) return payment.amount

    const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
    const penalty = payment.amount * 0.02
    const interest = payment.amount * 0.00033 * daysLate
    
    return payment.amount + penalty + interest
  }

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'Data inválida'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch (error) {
      return 'Data inválida'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'overdue':
        return 'Em Atraso'
      case 'pending':
        return 'Pendente'
      default:
        return status || 'Indefinido'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    try {
      const today = new Date()
      const due = new Date(dueDate)
      return today > due
    } catch (error) {
      return false
    }
  }

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0
    try {
      const today = new Date()
      const due = new Date(dueDate)
      const diffTime = today.getTime() - due.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    } catch (error) {
      return 0
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (!payment || !payment.tenant || !payment.property) return false
    
    const matchesSearch = 
      payment.tenant.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      payment.property.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Stats calculation
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p?.status === 'pending').length,
    overdue: payments.filter(p => p?.status === 'overdue').length,
    paid: payments.filter(p => p?.status === 'paid').length,
    totalAmount: payments
      .filter(p => p?.status === 'pending' || p?.status === 'overdue')
      .reduce((sum, p) => sum + (p?.amount || 0), 0),
    paidAmount: payments
      .filter(p => p?.status === 'paid')
      .reduce((sum, p) => sum + (p?.amount || 0), 0)
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os pagamentos de aluguel
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-400 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Em Atraso</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-400 mt-2">{stats.overdue}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor em Aberto</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  R$ {stats.totalAmount.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por inquilino ou imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Em Atraso</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const daysOverdue = getDaysOverdue(payment.dueDate)
            const paymentIsOverdue = isOverdue(payment.dueDate) && payment.status !== 'paid'
            
            return (
              <div key={payment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <DollarSign className="w-5 h-5" style={{color: '#ff4352'}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => handleTenantClick(payment.tenant?.name)}>
                          {payment.tenant?.name || 'Nome não disponível'}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusIcon(payment.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Endereço:</div>
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <span className="truncate text-sm">{payment.property?.address || 'Endereço não disponível'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vencimento:</div>
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{payment.dueDate ? formatDate(payment.dueDate) : 'Data não disponível'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor:</div>
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <span className="font-bold">R$ {(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Imóvel:</div>
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <span className="truncate text-sm">{payment.property?.title || 'Título não disponível'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {paymentIsOverdue && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-xs text-red-800">
                        Em atraso há {daysOverdue} dias
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end mt-3">
                  <div className="flex space-x-2">
                    {payment.status === 'paid' && payment.receiptUrl && (
                      <button 
                        onClick={() => viewReceipt(payment)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110 relative"
                        title="Ver comprovante"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      </button>
                    )}
                    {payment.status !== 'paid' && (
                      <button 
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowModal(true)
                        }}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                        title="Marcar como pago"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {payment.status === 'paid' && payment.receiptUrl && (
                    <button 
                      onClick={() => viewReceipt(payment)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
                    >
                      Ver Comprovante
                    </button>
                  )}
                  
                  {payment.status !== 'paid' && (
                    <button 
                      onClick={() => {
                        setSelectedPayment(payment)
                        setShowModal(true)
                      }}
                      className="text-green-600 hover:text-green-800 text-sm font-medium ml-4"
                    >
                      Marcar como Pago
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum pagamento encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Nenhum pagamento foi encontrado no sistema.'}
            </p>
          </div>
        )}

        {/* Modal para todos os meses do inquilino */}
        {showAllMonths && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Histórico de Pagamentos - {selectedTenant}
                </h2>
                <button
                  onClick={() => {
                    setShowAllMonths(false)
                    setSelectedTenant(null)
                    setAllPayments([])
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {allPayments.map((payment) => {
                  const daysOverdue = getDaysOverdue(payment.dueDate)
                  const paymentIsOverdue = isOverdue(payment.dueDate) && payment.status !== 'paid'
                  
                  return (
                    <div key={payment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                            <DollarSign className="w-5 h-5" style={{color: '#ff4352'}} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {payment.property?.title || 'Título não disponível'}
                              </h3>
                              <div className="flex items-center space-x-2 ml-4">
                                {getStatusIcon(payment.status)}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                                  {getStatusText(payment.status)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Endereço:</div>
                                <div className="flex items-center text-gray-900 dark:text-white">
                                  <span className="truncate text-sm">{payment.property?.address || 'Endereço não disponível'}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vencimento:</div>
                                <div className="flex items-center text-gray-900 dark:text-white">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span className="truncate font-medium">{payment.dueDate ? formatDate(payment.dueDate) : 'Data não disponível'}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor:</div>
                                <div className="flex items-center text-gray-900 dark:text-white">
                                  <span className="font-bold">R$ {(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Imóvel:</div>
                                <div className="flex items-center text-gray-900 dark:text-white">
                                  <span className="truncate text-sm">{payment.property?.title || 'Título não disponível'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {paymentIsOverdue && (
                        <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                          <div className="flex items-center">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                            <span className="text-xs text-red-800 dark:text-red-300">
                              Em atraso há {daysOverdue} dias
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end mt-3">
                        <div className="flex space-x-2">
                          {payment.receiptUrl && (
                            <button 
                              onClick={() => viewReceipt(payment)}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 transform hover:scale-110 relative"
                              title="Ver comprovante"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                            </button>
                          )}
                          {payment.status !== 'paid' && payment.status !== 'PAID' && (
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setSelectedPayment(payment)
                                setShowModal(true)
                                // Fechar o modal de histórico temporariamente
                                setShowAllMonths(false)
                              }}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 transform hover:scale-110"
                              title="Marcar como pago"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {payment.status !== 'paid' && payment.status !== 'PAID' && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedPayment(payment)
                              setShowModal(true)
                              // Fechar o modal de histórico temporariamente
                              setShowAllMonths(false)
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium ml-4"
                          >
                            Marcar como Pago
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {allPayments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <DollarSign className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum pagamento encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Não há histórico de pagamentos para este inquilino.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {showModal && selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>Confirmar Pagamento</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Inquilino:</strong> {selectedPayment.tenant?.name || 'Nome não disponível'}</p>
              <p><strong>Valor Original:</strong> R$ {(selectedPayment.amount || 0).toFixed(2)}</p>
              <p><strong>Vencimento:</strong> {selectedPayment.dueDate ? formatDate(selectedPayment.dueDate) : 'Data não disponível'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3>Opções de Cobrança:</h3>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="interestOption"
                  checked={includeInterest}
                  onChange={() => setIncludeInterest(true)}
                  style={{ marginRight: '8px' }}
                />
                Valor com multa e juros: R$ {calculateTotal(selectedPayment)?.toFixed(2) || '0.00'}
              </label>
              
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="interestOption"
                  checked={!includeInterest}
                  onChange={() => setIncludeInterest(false)}
                  style={{ marginRight: '8px' }}
                />
                Apenas valor original: R$ {(selectedPayment.amount || 0).toFixed(2)}
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                <strong>Forma de Pagamento:</strong>
              </label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                <strong>Comprovante de Pagamento:</strong>
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".jpg,.jpeg,.png,.pdf"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  marginBottom: '10px'
                }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
              </small>
              
              {uploadedFile && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '5px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      📎 {uploadedFile.name}
                    </span>
                    <button
                      onClick={removeUploadedFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  
                  {uploadedFileUrl && (
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={uploadedFileUrl} 
                        alt="Preview" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '5px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                <strong>Observações:</strong>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o pagamento..."
                style={{ 
                  width: '100%', 
                  height: '80px', 
                  padding: '8px', 
                  borderRadius: '5px', 
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedPayment(null)
                  setNotes('')
                  setPaymentMethod('dinheiro')
                  setIncludeInterest(true)
                  setProcessingPayment(false)
                  removeUploadedFile()
                  // Reabrir o histórico se havia um inquilino selecionado
                  if (selectedTenant) {
                    setShowAllMonths(true)
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleMarkAsPaid}
                disabled={processingPayment}
                style={{
                  padding: '10px 20px',
                  backgroundColor: processingPayment ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: processingPayment ? 'not-allowed' : 'pointer',
                  opacity: processingPayment ? 0.7 : 1
                }}
              >
                {processingPayment ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {showReceiptModal && viewingReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Comprovante de Pagamento</h2>
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setViewingReceipt(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Detalhes do Pagamento</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <p><strong>Inquilino:</strong> {viewingReceipt.tenant?.name || 'Nome não disponível'}</p>
                <p><strong>Imóvel:</strong> {viewingReceipt.property?.title || 'Título não disponível'}</p>
                <p><strong>Valor:</strong> R$ {(viewingReceipt.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p><strong>Data do Pagamento:</strong> {viewingReceipt.paidDate ? formatDate(viewingReceipt.paidDate) : 'N/A'}</p>
                <p><strong>Vencimento:</strong> {viewingReceipt.dueDate ? formatDate(viewingReceipt.dueDate) : 'N/A'}</p>
                <p><strong>Forma de Pagamento:</strong> {viewingReceipt.paymentMethod || 'N/A'}</p>
              </div>
              {viewingReceipt.notes && (
                <div style={{ marginTop: '10px' }}>
                  <p><strong>Observações:</strong></p>
                  <p style={{ fontStyle: 'italic', color: '#666' }}>{viewingReceipt.notes}</p>
                </div>
              )}
            </div>

            {viewingReceipt.receiptUrl && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#333' }}>Comprovante</h3>
                  <a 
                    href={viewingReceipt.receiptUrl} 
                    download
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  >
                    <Download size={16} />
                    Download
                  </a>
                </div>
                <div style={{ textAlign: 'center', border: '2px dashed #ddd', borderRadius: '8px', padding: '20px' }}>
                  {viewingReceipt.receiptUrl.endsWith('.pdf') ? (
                    <div>
                      <FileText size={48} style={{ margin: '20px auto', color: '#666' }} />
                      <p style={{ margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>Arquivo PDF</p>
                      <p style={{ margin: '10px 0', color: '#666' }}>Clique no botão abaixo para visualizar</p>
                      <a 
                        href={viewingReceipt.receiptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '5px',
                          marginTop: '10px'
                        }}
                      >
                        <Eye size={16} />
                        Abrir PDF
                      </a>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>Imagem do Comprovante</p>
                      <img 
                        src={viewingReceipt.receiptUrl} 
                        alt="Comprovante de pagamento" 
                        style={{
                          maxWidth: '100%',
                          maxHeight: '500px',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(viewingReceipt.receiptUrl, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <div style={{ display: 'none', textAlign: 'center', padding: '40px' }}>
                        <FileText size={48} style={{ margin: '20px auto', color: '#dc3545' }} />
                        <p style={{ color: '#dc3545', fontWeight: 'bold' }}>Não foi possível carregar a imagem</p>
                        <small style={{ color: '#666', wordBreak: 'break-all' }}>{viewingReceipt.receiptUrl}</small>
                      </div>
                      <p style={{ margin: '10px 0', fontSize: '12px', color: '#666' }}>
                        Clique na imagem para abrir em tamanho original
                      </p>
                    </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setViewingReceipt(null)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}
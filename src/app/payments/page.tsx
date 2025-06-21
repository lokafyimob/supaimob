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

interface Payment {
  id: string
  amount: number
  dueDate: string
  status: string
  receiptUrl?: string
  paidDate?: string
  paymentMethod?: string
  notes?: string
  tenant?: {
    name: string
  }
  property?: {
    title: string
    address: string
  }
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [includeInterest, setIncludeInterest] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null)
  const [showAllMonths, setShowAllMonths] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        
        const mappedPayments = data.map((payment: any) => ({
          ...payment,
          property: payment.contract?.property || {},
          tenant: payment.contract?.tenant || {}
        }))
        
        setPayments(mappedPayments)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPaymentsByTenant = async (tenantName: string) => {
    try {
      const response = await fetch('/api/payments/all-months')
      if (response.ok) {
        const data = await response.json()
        
        const mappedPayments = data.map((payment: any) => ({
          ...payment,
          property: payment.contract?.property || {},
          tenant: payment.contract?.tenant || {}
        })).filter((payment: Payment) => payment.tenant?.name === tenantName)
        
        setAllPayments(mappedPayments)
      }
    } catch (error) {
      console.error('Erro ao carregar todos os pagamentos:', error)
    }
  }

  const handleTenantClick = async (tenantName: string) => {
    if (!tenantName) return
    
    setSelectedTenant(tenantName)
    setShowAllMonths(true)
    await fetchAllPaymentsByTenant(tenantName)
  }

  const viewReceipt = (payment: Payment) => {
    setViewingReceipt(payment)
    setShowReceiptModal(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedPayment || processingPayment) return

    setProcessingPayment(true)
    try {
      let receiptUrl = ''
      
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
        await fetchPayments()
        
        if (showAllMonths && selectedTenant) {
          await fetchAllPaymentsByTenant(selectedTenant)
        }
        
        setShowModal(false)
        setSelectedPayment(null)
        setNotes('')
        setPaymentMethod('dinheiro')
        setIncludeInterest(true)
        setUploadedFile(null)
        setUploadedFileUrl('')
        
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Apenas arquivos JPG, PNG ou PDF são permitidos')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Tamanho máximo: 5MB')
        return
      }
      
      setUploadedFile(file)
      
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch (error) {
      return 'Data inválida'
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusText = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    try {
      const today = new Date()
      const due = new Date(dueDate)
      return today > due
    } catch (error) {
      return false
    }
  }

  const getDaysOverdue = (dueDate: string) => {
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

  const calculateTotal = (payment: Payment) => {
    if (!payment || !payment.amount) return 0
    if (!includeInterest) return payment.amount

    const today = new Date()
    const dueDate = new Date(payment.dueDate)
    
    if (today <= dueDate) return payment.amount

    const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const penalty = payment.amount * 0.02
    const interest = payment.amount * 0.00033 * daysLate
    
    return payment.amount + penalty + interest
  }

  const filteredPayments = payments.filter(payment => {
    if (!payment || !payment.tenant || !payment.property) return false
    
    const matchesSearch = 
      payment.tenant.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      payment.property.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

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
                            onClick={() => handleTenantClick(payment.tenant?.name || '')}>
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
                            <span className="truncate font-medium">{formatDate(payment.dueDate)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor:</div>
                          <div className="flex items-center text-gray-900 dark:text-white">
                            <span className="font-bold">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                        className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 text-sm font-medium"
                        title="Ver comprovante de pagamento"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Comprovante
                      </button>
                    )}
                    {payment.status === 'paid' && !payment.receiptUrl && (
                      <span className="inline-flex items-center px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Sem comprovante
                      </span>
                    )}
                    {payment.status !== 'paid' && (
                      <button 
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowModal(true)
                        }}
                        className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-all duration-200 text-sm font-medium"
                        title="Marcar como pago"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Pago
                      </button>
                    )}
                  </div>
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
                                  <span className="truncate font-medium">{formatDate(payment.dueDate)}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor:</div>
                                <div className="flex items-center text-gray-900 dark:text-white">
                                  <span className="font-bold">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                          {payment.status === 'paid' && payment.receiptUrl && (
                            <button 
                              onClick={() => viewReceipt(payment)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 text-sm font-medium"
                              title="Ver comprovante de pagamento"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Comprovante
                            </button>
                          )}
                          {payment.status === 'paid' && !payment.receiptUrl && (
                            <span className="inline-flex items-center px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
                              <FileText className="w-4 h-4 mr-2" />
                              Sem comprovante
                            </span>
                          )}
                          {payment.status !== 'paid' && (
                            <button 
                              onClick={() => {
                                setSelectedPayment(payment)
                                setShowModal(true)
                                setShowAllMonths(false)
                              }}
                              className="inline-flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all duration-200 text-sm font-medium"
                              title="Marcar como pago"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar como Pago
                            </button>
                          )}
                        </div>
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

        {/* Modal de Pagamento */}
        {showModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Pagamento</h2>
                
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p><strong>Inquilino:</strong> {selectedPayment.tenant?.name || 'Nome não disponível'}</p>
                  <p><strong>Valor Original:</strong> R$ {selectedPayment.amount.toFixed(2)}</p>
                  <p><strong>Vencimento:</strong> {formatDate(selectedPayment.dueDate)}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">Opções de Cobrança:</h3>
                  <label className="block mb-2">
                    <input
                      type="radio"
                      name="interestOption"
                      checked={includeInterest}
                      onChange={() => setIncludeInterest(true)}
                      className="mr-2"
                    />
                    Valor com multa e juros: R$ {calculateTotal(selectedPayment).toFixed(2)}
                  </label>
                  
                  <label className="block mb-2">
                    <input
                      type="radio"
                      name="interestOption"
                      checked={!includeInterest}
                      onChange={() => setIncludeInterest(false)}
                      className="mr-2"
                    />
                    Apenas valor original: R$ {selectedPayment.amount.toFixed(2)}
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-2">Forma de Pagamento:</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cartao">Cartão</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block font-medium mb-2">Comprovante de Pagamento:</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                  <small className="text-gray-600">Formatos aceitos: JPG, PNG, PDF (máx. 5MB)</small>
                  
                  {uploadedFile && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">📎 {uploadedFile.name}</span>
                        <button
                          onClick={removeUploadedFile}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {uploadedFileUrl && (
                        <div className="mt-2">
                          <img 
                            src={uploadedFileUrl} 
                            alt="Preview" 
                            className="max-w-full max-h-32 rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block font-medium mb-2">Observações:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações sobre o pagamento..."
                    className="w-full p-2 border border-gray-300 rounded-lg h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedPayment(null)
                      setNotes('')
                      setPaymentMethod('dinheiro')
                      setIncludeInterest(true)
                      setProcessingPayment(false)
                      removeUploadedFile()
                      if (selectedTenant) {
                        setShowAllMonths(true)
                      }
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={processingPayment}
                    className={`px-4 py-2 text-white rounded-lg ${
                      processingPayment 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {processingPayment ? 'Processando...' : 'Confirmar Pagamento'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização de Comprovante */}
        {showReceiptModal && viewingReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Comprovante de Pagamento</h2>
                <button
                  onClick={() => {
                    setShowReceiptModal(false)
                    setViewingReceipt(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Detalhes do Pagamento</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Inquilino:</strong> {viewingReceipt.tenant?.name || 'Nome não disponível'}</p>
                    <p><strong>Imóvel:</strong> {viewingReceipt.property?.title || 'Título não disponível'}</p>
                    <p><strong>Valor:</strong> R$ {viewingReceipt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><strong>Data do Pagamento:</strong> {viewingReceipt.paidDate ? formatDate(viewingReceipt.paidDate) : 'N/A'}</p>
                    <p><strong>Vencimento:</strong> {formatDate(viewingReceipt.dueDate)}</p>
                    <p><strong>Forma de Pagamento:</strong> {viewingReceipt.paymentMethod || 'N/A'}</p>
                  </div>
                  {viewingReceipt.notes && (
                    <div className="mt-3">
                      <p><strong>Observações:</strong></p>
                      <p className="text-gray-600 italic">{viewingReceipt.notes}</p>
                    </div>
                  )}
                </div>

                {viewingReceipt.receiptUrl && (
                  <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Comprovante</h3>
                      <a 
                        href={viewingReceipt.receiptUrl} 
                        download
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                    
                    {viewingReceipt.receiptUrl.endsWith('.pdf') ? (
                      <div>
                        <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-3">Arquivo PDF</p>
                        <a 
                          href={viewingReceipt.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Abrir PDF
                        </a>
                      </div>
                    ) : (
                      <div>
                        <img 
                          src={viewingReceipt.receiptUrl} 
                          alt="Comprovante de pagamento" 
                          className="max-w-full max-h-96 mx-auto rounded border cursor-pointer"
                          onClick={() => window.open(viewingReceipt.receiptUrl, '_blank')}
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Clique na imagem para abrir em tamanho original
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => {
                      setShowReceiptModal(false)
                      setViewingReceipt(null)
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
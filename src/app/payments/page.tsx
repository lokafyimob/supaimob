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
                    {payment.receiptUrl && (
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
      </div>
    </DashboardLayout>
  )
}
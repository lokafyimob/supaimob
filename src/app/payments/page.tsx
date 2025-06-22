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
  Download,
  Filter,
  Receipt,
  CreditCard,
  TrendingUp,
  Users,
  Home,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  Wallet,
  BadgeCheck,
  Timer,
  ExternalLink,
  Paperclip,
  ImageIcon,
  FileImage,
  Zap
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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Função para mostrar notificações
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000) // Remove após 4 segundos
  }

  // Função helper para normalizar status - definida antes das funções de fetch
  const isPaidStatus = (status: string) => {
    const normalizedStatus = status?.toUpperCase()
    return normalizedStatus === 'PAID'
  }

  // Função para download automático de arquivos
  const downloadFile = async (url: string, paymentId: string, tenantName?: string) => {
    try {
      // Gerar nome de arquivo mais descritivo
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      const tenant = tenantName ? tenantName.replace(/[^a-zA-Z0-9]/g, '_') : 'inquilino'
      const filename = `comprovante_${tenant}_${date}_${paymentId.slice(-4)}`
      
      console.log('🔽 Iniciando download automático:', { filename })
      
      // Para data URLs (base64), fazer download direto
      if (url.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = url
        
        // Determinar extensão baseada no tipo MIME
        const extension = url.includes('application/pdf') ? '.pdf' : 
                         url.includes('image/png') ? '.png' : '.jpg'
        link.download = filename + extension
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('✅ Download concluído:', filename + extension)
        return
      }
      
      // Para URLs normais
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename + '.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpar URL
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('✅ Download concluído:', filename)
    } catch (error) {
      console.error('❌ Erro no download:', error)
      showNotification('error', 'Erro ao fazer download do comprovante. Tente novamente.')
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Dados recebidos da API:', data)
        
        const mappedPayments = data.map((payment: any) => ({
          ...payment,
          // Mapear receipts para receiptUrl para compatibilidade
          receiptUrl: payment.receipts ? (() => {
            try {
              if (typeof payment.receipts === 'string') {
                const parsed = JSON.parse(payment.receipts)
                return parsed?.[0]?.url || null
              } else {
                return payment.receipts?.[0]?.url || null
              }
            } catch (error) {
              console.warn('Erro ao parsear receipts:', error)
              return null
            }
          })() : null,
          property: payment.contract?.property || {},
          tenant: payment.contract?.tenant || {}
        }))
        
        console.log('📊 Pagamentos mapeados:', mappedPayments)
        
        // Debug das categorias
        console.log('📊 Analisando categorização individual:')
        mappedPayments.forEach((p: Payment, index: number) => {
          const paid = isPaidStatus(p.status)
          const overdue = isOverdue(p.dueDate)
          const category = paid ? 'PAGO' : (overdue ? 'EM_ATRASO' : 'A_VENCER')
          console.log(`${index + 1}. ${p.tenant?.name} - Status: "${p.status}" - Due: ${p.dueDate} - Paid: ${paid} - Overdue: ${overdue} - Category: ${category}`)
        })
        
        const pendingCount = mappedPayments.filter((p: Payment) => !isPaidStatus(p.status) && !isOverdue(p.dueDate)).length
        const overdueCount = mappedPayments.filter((p: Payment) => !isPaidStatus(p.status) && isOverdue(p.dueDate)).length
        const paidCount = mappedPayments.filter((p: Payment) => isPaidStatus(p.status)).length
        
        console.log('📊 Resumo das Categorias:', {
          'A Vencer': pendingCount,
          'Em Atraso': overdueCount,
          'Pagos': paidCount,
          'Total': mappedPayments.length
        })
        
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
          // Mapear receipts para receiptUrl para compatibilidade
          receiptUrl: payment.receipts ? (() => {
            try {
              if (typeof payment.receipts === 'string') {
                const parsed = JSON.parse(payment.receipts)
                return parsed?.[0]?.url || null
              } else {
                return payment.receipts?.[0]?.url || null
              }
            } catch (error) {
              console.warn('Erro ao parsear receipts:', error)
              return null
            }
          })() : null,
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
    console.log('Visualizando comprovante:', {
      paymentId: payment.id,
      receiptUrl: payment.receiptUrl,
      status: payment.status,
      tenant: payment.tenant?.name
    })
    
    if (!payment.receiptUrl) {
      showNotification('error', 'Nenhum comprovante foi anexado a este pagamento')
      return
    }
    
    setViewingReceipt(payment)
    setShowReceiptModal(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedPayment || processingPayment) return

    setProcessingPayment(true)
    
    // Função para fechar modal e limpar dados
    const closeModalAndReset = () => {
      setShowModal(false)
      setSelectedPayment(null)
      setNotes('')
      setPaymentMethod('dinheiro')
      setIncludeInterest(true)
      setUploadedFile(null)
      setUploadedFileUrl('')
      setProcessingPayment(false)
    }

    try {
      // Usar a URL real do servidor (já foi feito upload no handleFileUpload)
      const receiptUrl = uploadedFileUrl // Esta é a URL real do servidor

      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          paymentMethod,
          notes,
          includeInterest,
          receipts: receiptUrl ? [{ url: receiptUrl, type: uploadedFile?.type || 'unknown' }] : null
        })
      })

      if (response.ok) {
        // Atualizar dados
        await fetchPayments()
        
        if (showAllMonths && selectedTenant) {
          await fetchAllPaymentsByTenant(selectedTenant)
        }
        
        // Fechar modal primeiro
        closeModalAndReset()
        
        // Mostrar feedback de sucesso
        showNotification('success', 'Pagamento marcado como pago com sucesso!')
        
        // Manter modal de histórico aberto se estava aberto
        if (selectedTenant) {
          setShowAllMonths(true)
        }
        
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao marcar pagamento como pago')
        closeModalAndReset()
      }
      
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error)
      showNotification('error', 'Erro ao processar pagamento. Tente novamente.')
      closeModalAndReset()
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Apenas arquivos JPG, PNG ou PDF são permitidos')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Arquivo muito grande. Tamanho máximo: 5MB')
      return
    }

    // Mostrar preview temporário
    const tempUrl = URL.createObjectURL(file)
    setUploadedFileUrl(tempUrl)
    setUploadedFile(file)

    try {
      // Upload para o servidor
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        // Atualizar com URL real do servidor
        setUploadedFileUrl(result.url)
        
        console.log('✅ Arquivo enviado com sucesso:', {
          filename: result.filename,
          url: result.url,
          size: result.size,
          type: result.type
        })
        
        showNotification('success', 'Comprovante carregado com sucesso!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro no upload')
      }
    } catch (error) {
      console.error('❌ Erro no upload:', error)
      showNotification('error', 'Erro ao enviar comprovante: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
      
      // Limpar em caso de erro
      setUploadedFile(null)
      setUploadedFileUrl('')
      URL.revokeObjectURL(tempUrl)
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
    if (isPaidStatus(status)) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    switch (status?.toUpperCase()) {
      case 'OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    if (isPaidStatus(status)) {
      return 'Pago'
    }
    switch (status?.toUpperCase()) {
      case 'OVERDUE':
        return 'Em Atraso'
      case 'PENDING':
        return 'Pendente'
      default:
        return status || 'Indefinido'
    }
  }

  const getStatusColor = (status: string) => {
    if (isPaidStatus(status)) {
      return 'bg-green-100 text-green-800'
    }
    switch (status?.toUpperCase()) {
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Zerar as horas para comparar apenas a data
      
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0) // Zerar as horas para comparar apenas a data
      
      const result = today > due
      console.log(`🗓️ isOverdue check: ${dueDate} -> due: ${due.toISOString().split('T')[0]}, today: ${today.toISOString().split('T')[0]}, overdue: ${result}`)
      return result
    } catch (error) {
      console.error('Erro ao verificar vencimento:', error, dueDate)
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
    
    let matchesStatus = false
    
    if (filterStatus === 'all') {
      matchesStatus = true
    } else if (filterStatus === 'pending') {
      // A Vencer: não pago e não vencido
      matchesStatus = !isPaidStatus(payment.status) && !isOverdue(payment.dueDate)
    } else if (filterStatus === 'overdue') {
      // Em Atraso: não pago e vencido
      matchesStatus = !isPaidStatus(payment.status) && isOverdue(payment.dueDate)
    } else if (filterStatus === 'paid') {
      matchesStatus = isPaidStatus(payment.status)
    }

    return matchesSearch && matchesStatus
  })

  // Calcular estatísticas com lógica mais clara
  const pendingPayments = payments.filter(p => {
    if (!p || isPaidStatus(p.status)) return false
    return !isOverdue(p.dueDate) // A vencer = não pago e não vencido
  })
  
  const overduePayments = payments.filter(p => {
    if (!p || isPaidStatus(p.status)) return false
    return isOverdue(p.dueDate) // Em atraso = não pago e vencido
  })
  
  const paidPayments = payments.filter(p => p && isPaidStatus(p.status))

  const stats = {
    total: payments.length,
    pending: pendingPayments.length,
    overdue: overduePayments.length,
    paid: paidPayments.length,
    totalAmount: [...pendingPayments, ...overduePayments].reduce((sum, p) => sum + (p?.amount || 0), 0),
    paidAmount: paidPayments.reduce((sum, p) => sum + (p?.amount || 0), 0)
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os pagamentos de aluguel
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-blue-200/50 dark:border-blue-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-amber-200/50 dark:border-amber-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">A Vencer</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-white mt-1">{stats.pending}</p>
              </div>
              <div className="bg-amber-500 p-3 rounded-xl shadow-md">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-red-200/50 dark:border-red-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">Em Atraso</p>
                <p className="text-2xl font-bold text-red-900 dark:text-white mt-1">{stats.overdue}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-xl shadow-md">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-4 border border-emerald-200/50 dark:border-emerald-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Valor</p>
                <p className="text-xl font-bold text-emerald-900 dark:text-white mt-1">
                  R$ {stats.totalAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por inquilino ou imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50"
              />
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 lg:min-w-max">
              {filteredPayments.length} de {payments.length} resultados
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  {filterStatus === 'all' && <Filter className="w-4 h-4 text-gray-500" />}
                  {filterStatus === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                  {filterStatus === 'overdue' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {filterStatus === 'paid' && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50 font-medium text-sm min-w-[140px]"
                >
                  <option value="all">Todos</option>
                  <option value="pending">A Vencer</option>
                  <option value="overdue">Em Atraso</option>
                  <option value="paid">Pagos</option>
                </select>
                <ChevronRight className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              {(searchTerm || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterStatus('all')
                  }}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const daysOverdue = getDaysOverdue(payment.dueDate)
            const paymentIsOverdue = isOverdue(payment.dueDate) && !isPaidStatus(payment.status)
            
            const getStatusGradient = (status: string) => {
              if (isPaidStatus(status)) {
                return 'from-emerald-500 to-green-600'
              }
              switch (status?.toLowerCase()) {
                case 'overdue':
                  return 'from-red-500 to-red-600'
                case 'pending':
                  return 'from-amber-500 to-orange-600'
                default:
                  return 'from-gray-500 to-gray-600'
              }
            }
            
            return (
              <div key={payment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1 bg-gradient-to-r ${getStatusGradient(payment.status)}`}></div>
                
                <div className="p-3">
                  {/* Header - Compact */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {isPaidStatus(payment.status) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <BadgeCheck className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={() => handleTenantClick(payment.tenant?.name || '')}>
                          {payment.tenant?.name || 'Nome não disponível'}
                        </h3>
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <Home className="w-3 h-3 mr-1" />
                          <span className="text-xs">{payment.property?.title || 'Título não disponível'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm bg-gradient-to-r ${getStatusGradient(payment.status)} text-white`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{getStatusText(payment.status)}</span>
                      </div>
                      {paymentIsOverdue && (
                        <div className="mt-1 flex items-center text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          <span className="text-xs font-medium">{daysOverdue}d</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Grid - Compact */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Local</span>
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {payment.property?.address || 'Endereço não disponível'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Vencimento</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded border border-green-200/50 dark:border-green-700/50">
                      <div className="flex items-center mb-1">
                        <CreditCard className="w-3 h-3 text-green-600 dark:text-green-400 mr-1" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Valor</span>
                      </div>
                      <p className="text-sm font-bold text-green-900 dark:text-white">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      {payment.paidDate && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          <span>Pago em {formatDate(payment.paidDate)}</span>
                        </div>
                      )}
                      {payment.paymentMethod && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg">
                          {payment.paymentMethod}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {isPaidStatus(payment.status) && payment.receiptUrl && (
                        <button 
                          onClick={() => viewReceipt(payment)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Ver comprovante de pagamento"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Ver Comprovante
                        </button>
                      )}
                      
                      {isPaidStatus(payment.status) && !payment.receiptUrl && (
                        <div className="inline-flex items-center px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium">
                          <FileText className="w-3 h-3 mr-1" />
                          Sem comprovante
                        </div>
                      )}
                      
                      {!isPaidStatus(payment.status) && (
                        <button 
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowModal(true)
                          }}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                          title="Marcar como pago"
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Marcar como Pago
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleTenantClick(payment.tenant?.name || '')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Ver histórico completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
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
                  const paymentIsOverdue = isOverdue(payment.dueDate) && !isPaidStatus(payment.status)
                  
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
                          {isPaidStatus(payment.status) && payment.receiptUrl && (
                            <button 
                              onClick={() => viewReceipt(payment)}
                              className="inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all duration-200 text-sm font-medium"
                              title="Ver comprovante de pagamento"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Comprovante
                            </button>
                          )}
                          {isPaidStatus(payment.status) && !payment.receiptUrl && (
                            <span className="inline-flex items-center px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm">
                              <FileText className="w-4 h-4 mr-2" />
                              Sem comprovante
                            </span>
                          )}
                          {!isPaidStatus(payment.status) && (
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

        {/* Enhanced Receipt Modal */}
        {showReceiptModal && viewingReceipt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Comprovante de Pagamento</h2>
                      <p className="text-sm text-blue-100">Detalhes da transação</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReceiptModal(false)
                      setViewingReceipt(null)
                    }}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)]">
                {/* Payment Details Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 mb-4 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Detalhes do Pagamento</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Users className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Inquilino</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingReceipt.tenant?.name || 'Nome não disponível'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Building className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Imóvel</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingReceipt.property?.title || 'Título não disponível'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <DollarSign className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Valor Pago</span>
                      </div>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        R$ {viewingReceipt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Data do Pagamento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingReceipt.paidDate ? formatDate(viewingReceipt.paidDate) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Vencimento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(viewingReceipt.dueDate)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <CreditCard className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Forma de Pagamento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {viewingReceipt.paymentMethod || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {viewingReceipt.notes && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-start">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2" />
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Observações</h4>
                          <p className="text-xs text-blue-700 dark:text-blue-200 italic">{viewingReceipt.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Receipt Display */}
                {viewingReceipt.receiptUrl ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4">
                    <div 
                      className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-all duration-200"
                      onClick={() => downloadFile(viewingReceipt.receiptUrl, viewingReceipt.id, viewingReceipt.tenant?.name)}
                      title="Clique para baixar o comprovante"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                          <Paperclip className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">Comprovante Anexado</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Clique aqui para baixar o comprovante</p>
                        </div>
                      </div>
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Download className="w-4 h-4 mr-1" />
                        <span className="text-sm font-semibold">Baixar</span>
                      </div>
                    </div>
                    
                    {viewingReceipt.receiptUrl.endsWith('.pdf') ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Documento PDF</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Clique no botão abaixo para visualizar o arquivo</p>
                        <a 
                          href={viewingReceipt.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Abrir PDF
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="relative inline-block rounded-xl overflow-hidden shadow-xl">
                          <img 
                            src={viewingReceipt.receiptUrl} 
                            alt="Comprovante de pagamento" 
                            className="max-w-full max-h-64 cursor-pointer transition-transform duration-200 hover:scale-105"
                            onClick={() => window.open(viewingReceipt.receiptUrl, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                            <div className="bg-white/90 rounded-full p-2">
                              <ExternalLink className="w-4 h-4 text-gray-900" />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 flex items-center justify-center">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Clique na imagem para abrir em tamanho original
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-600 p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Nenhum comprovante anexado</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Este pagamento foi marcado como pago mas não possui comprovante anexado.
                    </p>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right max-w-md ${
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
                className="h-full bg-white/60 rounded-full transition-all duration-4000 ease-linear"
                style={{ 
                  width: '100%',
                  animation: 'shrink 4s linear forwards'
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
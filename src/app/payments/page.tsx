'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  CreditCard, 
  Search, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Send,
  Upload,
  X,
  Image,
  RefreshCw
} from 'lucide-react'

// Helper functions
const getPaymentMethodText = (method?: string) => {
  switch (method) {
    case 'BOLETO': return 'Boleto'
    case 'PIX': return 'PIX'
    case 'DINHEIRO': return 'Dinheiro'
    case 'TRANSFERENCIA': return 'Transferência'
    case 'CARTAO': return 'Cartão'
    default: return 'Não informado'
  }
}

const getPaymentMethodColor = (method?: string) => {
  switch (method) {
    case 'BOLETO': return 'bg-orange-100 text-orange-800'
    case 'PIX': return 'bg-green-100 text-green-800'
    case 'DINHEIRO': return 'bg-blue-100 text-blue-800'
    case 'TRANSFERENCIA': return 'bg-purple-100 text-purple-800'
    case 'CARTAO': return 'bg-indigo-100 text-indigo-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}



interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: 'BOLETO' | 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'CARTAO'
  boletoUrl?: string
  boletoCode?: string
  penalty?: number
  interest?: number
  receipts?: Array<{name: string, data: string, type: string}>
  notes?: string
  contract: {
    id: string
    property: {
      title: string
      address: string
    }
    tenant: {
      name: string
      email: string
    }
  }
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [paymentSettings, setPaymentSettings] = useState({
    penaltyRate: 2.0,          // 2% padrão
    dailyInterestRate: 0.033,  // 0.033% ao dia padrão
    gracePeriodDays: 0,        // sem carência padrão
    maxInterestDays: 365       // máximo 1 ano padrão
  })
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [showReceiptsModal, setShowReceiptsModal] = useState(false)
  const [viewingReceipts, setViewingReceipts] = useState<Payment | null>(null)
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<{name: string, email: string, contractId: string} | null>(null)
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([])
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Estado para o modal simplificado
  const [paymentMethod, setPaymentMethod] = useState('')
  const [receipts, setReceipts] = useState<Array<{name: string, data: string, type: string}>>([])

  // Função para calcular multa e juros em tempo real
  const calculateLateFees = (payment: Payment) => {
    if (payment.status === 'PAID') {
      // Para pagamentos já pagos, mostrar multa e juros que foram efetivamente pagos
      const penalty = payment.penalty || 0
      const interest = payment.interest || 0
      // O campo amount já inclui penalty + interest, então mostramos o total diretamente
      console.log(`💰 DEBUG PAID PAYMENT - ID: ${payment.id}, Penalty: ${penalty}, Interest: ${interest}, Total: ${payment.amount}`)
      return { penalty, interest, total: payment.amount, daysPastDue: 0, effectiveDays: 0, isInGracePeriod: false }
    }

    const dueDate = new Date(payment.dueDate)
    const currentDate = new Date()
    const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    if (daysPastDue <= 0) {
      return { penalty: 0, interest: 0, total: payment.amount, daysPastDue: 0, effectiveDays: 0, isInGracePeriod: false }
    }

    // Aplicar período de carência
    const effectiveDays = Math.max(0, daysPastDue - paymentSettings.gracePeriodDays)
    const isInGracePeriod = effectiveDays <= 0

    if (isInGracePeriod) {
      return { penalty: 0, interest: 0, total: payment.amount, daysPastDue, effectiveDays: 0, isInGracePeriod: true }
    }

    // Calcular multa e juros
    const penalty = payment.amount * (paymentSettings.penaltyRate / 100)
    const daysForInterest = Math.min(effectiveDays, paymentSettings.maxInterestDays)
    const interest = payment.amount * (paymentSettings.dailyInterestRate / 100) * daysForInterest
    const total = payment.amount + penalty + interest

    return {
      penalty: Math.round(penalty * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      total: Math.round(total * 100) / 100,
      daysPastDue,
      effectiveDays,
      isInGracePeriod: false
    }
  }

  useEffect(() => {
    loadPaymentSettings()
    fetchPayments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPaymentSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.financial) {
          setPaymentSettings({
            penaltyRate: data.financial.penaltyRate || 2.0,
            dailyInterestRate: data.financial.dailyInterestRate || 0.033,
            gracePeriodDays: data.financial.gracePeriodDays || 0,
            maxInterestDays: data.financial.maxInterestDays || 365
          })
          console.log('💰 Configurações de pagamento carregadas:', data.financial)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de pagamento:', error)
    }
  }

  const fetchPayments = useCallback(async () => {
    try {
      console.log('🔄 Carregando pagamentos...')
      
      // Verificar autenticação primeiro
      console.log('🔐 Verificando sessão...')
      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()
      console.log('👤 Sessão atual:', session)
      
      if (!session || !session.user) {
        console.log('❌ Não há sessão ativa!')
        showNotification('error', 'Sessão não encontrada. Redirecionando...')
        window.location.href = '/login'
        return
      }
      
      // Buscar pagamentos reais do banco
      console.log('📡 Fazendo requisição para /api/payments...')
      const paymentsResponse = await fetch('/api/payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      })
      console.log('📡 Response status da API payments:', paymentsResponse.status)
      console.log('📡 Response headers:', Object.fromEntries(paymentsResponse.headers.entries()))
      
      if (paymentsResponse.ok) {
        const realPayments = await paymentsResponse.json()
        console.log('✅ Pagamentos carregados do banco:', realPayments.length)
        console.log('📋 Dados brutos da API:', realPayments)
        
        // Sempre processar os pagamentos reais, mesmo que seja array vazio
        console.log('📊 Processando pagamentos reais...')
        console.log('📊 Type of realPayments:', typeof realPayments)
        console.log('📊 Is Array:', Array.isArray(realPayments))
        console.log('📊 Length:', realPayments?.length)
        
        if (realPayments && Array.isArray(realPayments)) {
          console.log('✅ Dados brutos da API:', realPayments)
          
          // Mapear os dados do banco para o formato esperado pela interface
          const formattedPayments = realPayments.map((payment: Record<string, any>) => {
            console.log('🔄 Formatando pagamento:', payment.id, payment.contract?.tenant?.name)
            return {
              id: payment.id, // Usar ID real do banco
              amount: payment.amount,
              dueDate: payment.dueDate,
              paidDate: payment.paidDate,
              status: payment.status,
              paymentMethod: payment.paymentMethod,
              boletoUrl: payment.boletoUrl,
              boletoCode: payment.boletoCode,
              penalty: payment.penalty,
              interest: payment.interest,
              receipts: payment.receipts ? JSON.parse(payment.receipts) : undefined,
              notes: payment.notes,
              contract: {
                id: payment.contract.id,
                property: {
                  title: payment.contract.property.title,
                  address: payment.contract.property.address
                },
                tenant: {
                  name: payment.contract.tenant.name,
                  email: payment.contract.tenant.email
                }
              }
            }
          })
          
          console.log('📋 Pagamentos formatados para a interface:', formattedPayments.length)
          console.log('📋 Dados formatados:', formattedPayments)
          
          setPayments(formattedPayments)
          console.log('✅ setPayments() executado')
          setLoading(false)
          console.log('✅ setLoading(false) executado')
          return
        } else {
          console.log('📋 Nenhum pagamento encontrado, definindo array vazio')
          setPayments([])
          setLoading(false)
          return
        }
      } else {
        console.log('❌ Erro na API payments:', paymentsResponse.status)
        const errorText = await paymentsResponse.text()
        console.log('❌ Detalhes do erro:', errorText)
        
        // Se não autorizado, redirecionar para login
        if (paymentsResponse.status === 401) {
          console.log('🔐 Usuário não autorizado, redirecionando...')
          window.location.href = '/login'
          return
        }
        
        // Para outros erros, mostrar array vazio
        console.log('❌ Erro na API, definindo array vazio')
        setPayments([])
        setLoading(false)
        return
      }
      
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleMarkAsPaid = (payment: Payment) => {
    console.log('=== DEBUG handleMarkAsPaid ====')
    console.log('Payment clicado:', payment)
    
    setEditingPayment(payment)
    setShowPaymentModal(true)
    setPaymentMethod('')
    setReceipts([])
    
    console.log('Modal deve abrir agora')
    console.log('=== FIM DEBUG handleMarkAsPaid ====')
  }

  const handleSavePayment = async () => {
    console.log('💰 === MODAL SAVE PAYMENT ===')
    console.log('editingPayment ID:', editingPayment?.id)
    console.log('editingPayment objeto completo:', editingPayment)
    console.log('paymentMethod:', paymentMethod)
    console.log('receipts:', receipts)
    
    if (!editingPayment || !paymentMethod) {
      console.log('❌ Condição falhou - editingPayment ou paymentMethod vazio')
      console.log('editingPayment existe?', !!editingPayment)
      console.log('paymentMethod existe?', !!paymentMethod)
      showNotification('error', 'Dados incompletos para salvar')
      return
    }

    try {
      setLoading(true)
      
      // First, check authentication status
      console.log('🔐 Verificando autenticação...')
      const authCheckResponse = await fetch('/api/auth/session')
      const session = await authCheckResponse.json()
      console.log('👤 Session status:', session)
      
      if (!session || !session.user) {
        console.log('❌ Usuário não autenticado')
        showNotification('error', 'Sessão expirada. Faça login novamente.')
        window.location.href = '/login'
        return
      }
      
      console.log('🚀 Enviando para API mark-paid...')
      console.log('URL:', '/api/payments/mark-paid')
      console.log('Payment ID enviado:', editingPayment.id)
      
      const requestBody = {
        paymentId: editingPayment.id,
        paymentMethod: paymentMethod,
        receipts: receipts.length > 0 ? receipts : [{
          name: 'comprovante-exemplo.jpg',
          data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          type: 'image/jpeg'
        }],
        notes: `Pagamento via ${paymentMethod} - Processado em ${new Date().toLocaleString('pt-BR')}`
      }
      
      console.log('📋 Request body:', requestBody)
      
      // Usar a API principal de pagamentos
      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      console.log('📨 Response status:', response.status)
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Pagamento salvo no banco:', result)
        console.log('💰 Valores retornados da API:')
        console.log('  - Amount:', result.payment.amount)
        console.log('  - Penalty:', result.payment.penalty)
        console.log('  - Interest:', result.payment.interest)
        console.log('  - Status:', result.payment.status)
        
        // Atualizar o state local com os dados do banco
        const updatedPayments = payments.map(p => {
          if (p.id === editingPayment.id) {
            return { 
              ...p, 
              status: 'PAID' as const,
              amount: result.payment.amount, // Atualizar com valor total incluindo juros
              penalty: result.payment.penalty,
              interest: result.payment.interest,
              paidDate: result.payment.paidDate,
              paymentMethod: result.payment.paymentMethod as "BOLETO" | "PIX" | "DINHEIRO" | "TRANSFERENCIA" | "CARTAO",
              receipts: result.payment.receipts ? JSON.parse(result.payment.receipts) : undefined
            }
          }
          return p
        })

        setPayments(updatedPayments)
        
        // Se o modal do inquilino estiver aberto, atualizar também
        if (showTenantModal && selectedTenant) {
          const updatedTenantPayments = tenantPayments.map(p => 
            p.id === editingPayment.id 
              ? updatedPayments.find(up => up.id === p.id) || p
              : p
          )
          setTenantPayments(updatedTenantPayments)
        }
        
        // Forçar re-renderização para mostrar valores atualizados
        console.log('🔄 Forçando atualização da interface...')
        setTimeout(() => {
          setPayments([...updatedPayments]) // Force re-render
        }, 100)
        
        showNotification('success', 'Pagamento marcado como pago e salvo no banco!')
        
        // Forçar reload completo dos dados do banco para garantir atualização
        console.log('🔄 Forçando reload completo dos dados...')
        setTimeout(() => {
          fetchPayments() // Recarregar tudo do banco
        }, 500)
        
        // Notify other components about the payment update
        window.dispatchEvent(new CustomEvent('paymentUpdated'))
        
      } else {
        console.log('❌ Response não OK')
        const errorText = await response.text()
        console.log('📋 Error response raw:', errorText)
        
        try {
          const error = JSON.parse(errorText)
          console.log('📋 Error parsed:', error)
          
          if (response.status === 401) {
            showNotification('error', 'Sessão expirada. Redirecionando para login...')
            setTimeout(() => window.location.href = '/login', 2000)
          } else if (response.status === 404) {
            showNotification('error', `Pagamento não encontrado. ID: ${editingPayment.id}`)
          } else {
            showNotification('error', `Erro ao salvar: ${error.error || 'Erro desconhecido'}`)
          }
          
          if (error.debug) {
            console.log('🔍 Debug info from API:', error.debug)
          }
        } catch (parseError) {
          console.log('❌ Erro ao parsear resposta de erro:', parseError)
          showNotification('error', `Erro ao salvar pagamento (${response.status})`)
        }
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição completa:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
      showNotification('error', 'Erro ao salvar pagamento')
    } finally {
      setLoading(false)
      setShowPaymentModal(false)
      setEditingPayment(null)
    }
    
    console.log('=== FIM DEBUG ====')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      console.log('Arquivos selecionados:', files)
      
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          console.log('Arquivo carregado:', file.name)
          
          // Adicionar o arquivo como base64 para visualização
          setReceipts(prev => [...prev, {
            name: file.name,
            data: dataUrl,
            type: file.type
          }])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeReceipt = (index: number) => {
    setReceipts(receipts.filter((_, i) => i !== index))
  }

  const viewReceipts = (payment: Payment) => {
    setViewingReceipts(payment)
    setShowReceiptsModal(true)
  }

  const viewTenantHistory = (payment: Payment) => {
    const tenant = {
      name: payment.contract.tenant.name,
      email: payment.contract.tenant.email,
      contractId: payment.contract.id
    }
    
    // Filtrar todos os pagamentos deste inquilino
    const tenantAllPayments = payments.filter(p => 
      p.contract.id === payment.contract.id
    )
    
    setSelectedTenant(tenant)
    setTenantPayments(tenantAllPayments)
    setShowTenantModal(true)
  }

  // Filtrar apenas pagamentos do mês atual para cada inquilino
  const getCurrentMonthPaymentsByTenant = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() // 0-11 
    const currentYear = currentDate.getFullYear()
    
    console.log(`📅 Filtrando pagamentos para: ${currentMonth + 1}/${currentYear}`)
    
    // Agrupar por inquilino
    const paymentsByTenant = new Map()
    
    payments.forEach(payment => {
      const tenantKey = `${payment.contract.tenant.name}-${payment.contract.id}`
      
      if (!paymentsByTenant.has(tenantKey)) {
        paymentsByTenant.set(tenantKey, [])
      }
      paymentsByTenant.get(tenantKey).push(payment)
    })
    
    // Pegar apenas o pagamento do mês atual de cada inquilino
    const currentMonthPayments: Payment[] = []
    
    paymentsByTenant.forEach(tenantPaymentsList => {
      // Encontrar o pagamento do mês atual
      const currentMonthPayment = tenantPaymentsList.find((payment: Payment) => {
        const paymentDate = new Date(payment.dueDate)
        const paymentMonth = paymentDate.getMonth()
        const paymentYear = paymentDate.getFullYear()
        
        console.log(`🔍 Verificando pagamento: ${payment.contract.tenant.name} - ${paymentDate.toLocaleDateString('pt-BR')} (${paymentMonth + 1}/${paymentYear})`)
        
        return paymentMonth === currentMonth && paymentYear === currentYear
      })
      
      if (currentMonthPayment) {
        console.log(`✅ Pagamento do mês atual encontrado: ${currentMonthPayment.contract.tenant.name}`)
        currentMonthPayments.push(currentMonthPayment)
      } else {
        console.log(`❌ Nenhum pagamento do mês atual para: ${tenantPaymentsList[0]?.contract.tenant.name}`)
      }
    })
    
    console.log(`📊 Total de pagamentos do mês atual: ${currentMonthPayments.length}`)
    return currentMonthPayments
  }

  const currentMonthPayments = getCurrentMonthPaymentsByTenant()
  console.log('🎯 currentMonthPayments resultado:', currentMonthPayments.length)
  console.log('🎯 currentMonthPayments dados:', currentMonthPayments)
  
  const filteredPayments = currentMonthPayments.filter(payment => {
    const matchesSearch = 
      payment.contract.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.contract.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.boletoCode?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  console.log('🎯 filteredPayments resultado:', filteredPayments.length)
  console.log('🎯 filteredPayments dados:', filteredPayments)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-gray-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Pago'
      case 'PENDING':
        return 'Pendente'
      case 'OVERDUE':
        return 'Em Atraso'
      case 'CANCELLED':
        return 'Cancelado'
      default:
        return status
    }
  }

  const stats = {
    total: currentMonthPayments.length,
    pending: currentMonthPayments.filter(p => p.status === 'PENDING').length,
    paid: currentMonthPayments.filter(p => p.status === 'PAID').length,
    overdue: currentMonthPayments.filter(p => p.status === 'OVERDUE').length,
    receivedAmount: currentMonthPayments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0)
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
            <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os pagamentos de aluguel
            </p>
            <div className="mt-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                📊 {payments.length} pagamentos carregados
              </span>
              {loading && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⏳ Carregando...
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 sm:mt-0 hidden md:flex space-x-2">
            <button 
              onClick={() => {
                console.log('🔄 Forçando refresh dos dados...')
                setLoading(true)
                fetchPayments()
              }}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              title="Atualizar dados"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.paid}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-900 mt-2">{stats.overdue}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Recebido</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.receivedAmount.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
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
                placeholder="Buscar por inquilino, imóvel ou código do boleto..."
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
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Em Atraso</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                📅 Pagamentos de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquilino / Imóvel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Forma Pag.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <button
                          onClick={() => viewTenantHistory(payment)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {payment.contract.tenant.name}
                        </button>
                        <div className="text-sm text-gray-500">
                          {payment.contract.property.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {payment.contract.property.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                      {payment.paidDate && (
                        <div className="text-xs text-green-600">
                          Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {(() => {
                        const lateFees = calculateLateFees(payment)
                        if (lateFees.daysPastDue > 0 && payment.status !== 'PAID') {
                          return (
                            <div className="text-xs text-orange-600 mt-1">
                              {lateFees.daysPastDue} dias de atraso
                              {lateFees.isInGracePeriod && (
                                <span className="text-blue-600"> (em carência)</span>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {payment.amount.toLocaleString('pt-BR')}
                      </div>
                      {(() => {
                        const lateFees = calculateLateFees(payment)
                        console.log(`🎨 RENDER - Payment ${payment.id} (${payment.status}): penalty=${lateFees.penalty}, interest=${lateFees.interest}`)
                        if (lateFees.penalty > 0 || lateFees.interest > 0) {
                          console.log(`✅ SHOWING LATE FEES for ${payment.id}`)
                          return (
                            <>
                              <div className="text-xs text-red-600">
                                + R$ {(lateFees.penalty + lateFees.interest).toLocaleString('pt-BR')} (multa/juros)
                              </div>
                              <div className="text-sm font-medium text-red-900">
                                Total: R$ {lateFees.total.toLocaleString('pt-BR')}
                              </div>
                            </>
                          )
                        } else {
                          console.log(`❌ NOT SHOWING LATE FEES for ${payment.id} - penalty: ${lateFees.penalty}, interest: ${lateFees.interest}`)
                        }
                        if (lateFees.isInGracePeriod && lateFees.daysPastDue > 0) {
                          return (
                            <div className="text-xs text-blue-600">
                              Período de carência ({paymentSettings.gracePeriodDays - lateFees.daysPastDue} dias restantes)
                            </div>
                          )
                        }
                        return null
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentMethod ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                          {getPaymentMethodText(payment.paymentMethod)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {payment.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkAsPaid(payment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Marcar como pago"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(payment.status === 'PAID' && payment.receipts && payment.receipts.length > 0) && (
                          <button
                            onClick={() => viewReceipts(payment)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Ver comprovantes"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Ver boleto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                          title="Enviar por email"
                        >
                          <Send className="w-4 h-4" />
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
          {filteredPayments.map((payment) => {
            const lateFees = calculateLateFees(payment)
            return (
              <div key={payment.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <CreditCard className="w-5 h-5" style={{color: '#ff4352'}} />
                    </div>
                    <div>
                      <button
                        onClick={() => viewTenantHistory(payment)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {payment.contract.tenant.name}
                      </button>
                      <p className="text-xs text-gray-500">{payment.contract.property.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <span className="text-sm font-medium">{new Date(payment.dueDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {payment.paidDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pago em:</span>
                      <span className="text-sm text-green-600">{new Date(payment.paidDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <div className="text-right">
                      <span className="text-sm font-bold">R$ {payment.amount.toLocaleString('pt-BR')}</span>
                      {(lateFees.penalty > 0 || lateFees.interest > 0) && (
                        <>
                          <div className="text-xs text-red-600">
                            + R$ {(lateFees.penalty + lateFees.interest).toLocaleString('pt-BR')} (multa/juros)
                          </div>
                          <div className="text-sm font-bold text-red-900">
                            Total: R$ {lateFees.total.toLocaleString('pt-BR')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {payment.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Forma de Pag.:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                        {getPaymentMethodText(payment.paymentMethod)}
                      </span>
                    </div>
                  )}
                  {lateFees.daysPastDue > 0 && payment.status !== 'PAID' && (
                    <div className="text-xs text-orange-600 mt-1">
                      {lateFees.daysPastDue} dias de atraso
                      {lateFees.isInGracePeriod && (
                        <span className="text-blue-600"> (em carência)</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2">
                  {payment.status !== 'PAID' && (
                    <button
                      onClick={() => handleMarkAsPaid(payment)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Marcar como pago"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {(payment.status === 'PAID' && payment.receipts && payment.receipts.length > 0) && (
                    <button
                      onClick={() => viewReceipts(payment)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Ver comprovantes"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver boleto"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Enviar por email"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pagamento encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Não há pagamentos cadastrados para este usuário.'}
            </p>
          </div>
        )}

        {/* Payment Update Modal - Beautiful Version */}
        {showPaymentModal && editingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Marcar Pagamento como Pago
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Payment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Informações do Pagamento</h3>
                  <p><span className="font-medium">Inquilino:</span> {editingPayment.contract.tenant.name}</p>
                  <p><span className="font-medium">Imóvel:</span> {editingPayment.contract.property.title}</p>
                  <p><span className="font-medium">Valor:</span> R$ {editingPayment.amount.toLocaleString('pt-BR')}</p>
                  <p><span className="font-medium">Vencimento:</span> {new Date(editingPayment.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    <option value="PIX">PIX</option>
                    <option value="TRANSFERENCIA">Transferência Bancária</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprovantes de Pagamento
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="cursor-pointer w-full flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-600">
                        Clique para fazer upload ou arraste arquivos aqui
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, PDF até 10MB cada
                      </p>
                    </label>
                  </div>

                  {/* Uploaded Files */}
                  {receipts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Arquivos adicionados:</p>
                      {receipts.map((receipt, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                          <div className="flex items-center space-x-3">
                            {receipt.type.startsWith('image/') ? (
                              <img 
                                src={receipt.data} 
                                alt={receipt.name}
                                className="w-8 h-8 object-cover rounded"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                📄
                              </div>
                            )}
                            <span className="text-sm text-gray-600">{receipt.name}</span>
                          </div>
                          <button
                            onClick={() => removeReceipt(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={!paymentMethod}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Marcar como Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipts Viewer Modal - Beautiful Version */}
        {showReceiptsModal && viewingReceipts && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Comprovantes de Pagamento
                </h2>
                <button
                  onClick={() => setShowReceiptsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Payment Info */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Informações do Pagamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-medium">Inquilino:</span> {viewingReceipts.contract.tenant.name}</p>
                      <p><span className="font-medium">Imóvel:</span> {viewingReceipts.contract.property.title}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Valor:</span> R$ {viewingReceipts.amount.toLocaleString('pt-BR')}</p>
                      <p><span className="font-medium">Forma:</span> {viewingReceipts.paymentMethod ? getPaymentMethodText(viewingReceipts.paymentMethod) : 'Não informado'}</p>
                      {viewingReceipts.paidDate && (
                        <p><span className="font-medium">Pago em:</span> {new Date(viewingReceipts.paidDate).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Receipts Grid */}
                {viewingReceipts.receipts && viewingReceipts.receipts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewingReceipts.receipts.map((receipt, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 flex items-center justify-center relative group cursor-pointer">
                          {typeof receipt === 'object' && receipt.type?.startsWith('image/') ? (
                            <img 
                              src={receipt.data}
                              alt={receipt.name}
                              className="w-full h-full object-cover"
                            />
                          ) : typeof receipt === 'object' && receipt.type?.includes('pdf') ? (
                            <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center p-4">
                              <div className="text-4xl mb-2">📄</div>
                              <div className="text-xs text-red-800 text-center">
                                <div className="font-bold">PDF</div>
                                <div className="mt-1">R$ {viewingReceipts.amount.toLocaleString('pt-BR')}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
                              <Image className="w-12 h-12 text-blue-600 mb-2" />
                              <div className="text-xs text-blue-800 text-center">
                                <div className="font-bold">COMPROVANTE</div>
                                <div className="mt-1">R$ {viewingReceipts.amount.toLocaleString('pt-BR')}</div>
                                <div className="mt-1 text-blue-600">{new Date(viewingReceipts.paidDate || Date.now()).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium">
                            {typeof receipt === 'object' ? receipt.name : `Comprovante ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {typeof receipt === 'object' 
                              ? `${receipt.type.includes('image') ? 'Imagem' : 'PDF'} • ${receipt.type.split('/')[1]?.toUpperCase()}`
                              : 'Imagem • JPG'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum comprovante disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tenant History Modal */}
        {showTenantModal && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Histórico de Pagamentos - {selectedTenant.name}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedTenant.email}</p>
                </div>
                <button
                  onClick={() => setShowTenantModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Stats for this tenant */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600">Total</div>
                    <div className="text-2xl font-bold text-blue-900">{tenantPayments.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600">Pagos</div>
                    <div className="text-2xl font-bold text-green-900">
                      {tenantPayments.filter(p => p.status === 'PAID').length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-yellow-600">Pendentes</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {tenantPayments.filter(p => p.status === 'PENDING').length}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-red-600">Em Atraso</div>
                    <div className="text-2xl font-bold text-red-900">
                      {tenantPayments.filter(p => p.status === 'OVERDUE').length}
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vencimento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Forma Pag.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tenantPayments
                        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
                        .map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </div>
                            {payment.paidDate && (
                              <div className="text-xs text-green-600">
                                Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            {(() => {
                              const lateFees = calculateLateFees(payment)
                              if (lateFees.daysPastDue > 0 && payment.status !== 'PAID') {
                                return (
                                  <div className="text-xs text-orange-600 mt-1">
                                    {lateFees.daysPastDue} dias de atraso
                                    {lateFees.isInGracePeriod && (
                                      <span className="text-blue-600"> (em carência)</span>
                                    )}
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              R$ {payment.amount.toLocaleString('pt-BR')}
                            </div>
                            {(() => {
                              const lateFees = calculateLateFees(payment)
                              if (lateFees.penalty > 0 || lateFees.interest > 0) {
                                return (
                                  <>
                                    <div className="text-xs text-red-600">
                                      + R$ {(lateFees.penalty + lateFees.interest).toLocaleString('pt-BR')} (multa/juros)
                                    </div>
                                    <div className="text-sm font-medium text-red-900">
                                      Total: R$ {lateFees.total.toLocaleString('pt-BR')}
                                    </div>
                                  </>
                                )
                              }
                              if (lateFees.isInGracePeriod && lateFees.daysPastDue > 0) {
                                return (
                                  <div className="text-xs text-blue-600">
                                    Período de carência ({paymentSettings.gracePeriodDays - lateFees.daysPastDue} dias restantes)
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {payment.paymentMethod ? (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(payment.paymentMethod)}`}>
                                {getPaymentMethodText(payment.paymentMethod)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(payment.status)}
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                                {getStatusText(payment.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {payment.status !== 'PAID' && (
                                <button
                                  onClick={() => {
                                    setEditingPayment(payment)
                                    setShowPaymentModal(true)
                                    setPaymentMethod('')
                                    setReceipts([])
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Marcar como pago"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {(payment.status === 'PAID' && payment.receipts && payment.receipts.length > 0) && (
                                <button
                                  onClick={() => viewReceipts(payment)}
                                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Ver comprovantes"
                                >
                                  <Image className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Ver boleto"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-[70] px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right ${
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
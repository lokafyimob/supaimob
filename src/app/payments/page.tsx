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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pagamentos</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os pagamentos de aluguel
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {payments.map((payment) => (
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
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status:</div>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <span className="text-sm">{payment.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-3">
                <div className="flex space-x-2">
                  {payment.receiptUrl && (
                    <button 
                      onClick={() => viewReceipt(payment)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                      title="Ver comprovante"
                    >
                      <Eye className="w-4 h-4" />
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
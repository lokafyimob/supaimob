'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  DollarSign, 
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  Search,
  Eye,
  FileText
} from 'lucide-react'

export default function Payments() {
  const [payments, setPayments] = useState([
    {
      id: 1,
      amount: 1500.00,
      dueDate: '2025-01-15',
      status: 'pending',
      tenant: { name: 'João Silva', email: 'joao@email.com' },
      property: { title: 'Apartamento Centro', address: 'Rua A, 123' }
    },
    {
      id: 2,
      amount: 2200.00,
      dueDate: '2025-01-10',
      status: 'pending',
      tenant: { name: 'Maria Santos', email: 'maria@email.com' },
      property: { title: 'Casa Jardim América', address: 'Rua B, 456' }
    },
    {
      id: 3,
      amount: 1800.00,
      dueDate: '2024-12-20',
      status: 'paid',
      tenant: { name: 'Pedro Oliveira', email: 'pedro@email.com' },
      property: { title: 'Sala Comercial', address: 'Av. Principal, 789' },
      receiptUrl: '/uploads/receipts/comprovante-pedro.jpg',
      paidAt: '2024-12-22'
    },
    {
      id: 4,
      amount: 1200.00,
      dueDate: '2024-12-15',
      status: 'overdue',
      tenant: { name: 'Ana Costa', email: 'ana@email.com' },
      property: { title: 'Studio Downtown', address: 'Rua C, 321' }
    }
  ])
  const [loading, setLoading] = useState(false)
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

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      } else {
        // Se API falhar, usar dados de teste
        setPayments([
          {
            id: 1,
            amount: 1500.00,
            dueDate: '2025-01-15',
            status: 'pending',
            tenant: { name: 'João Silva' }
          },
          {
            id: 2,
            amount: 2200.00,
            dueDate: '2025-01-10',
            status: 'pending',
            tenant: { name: 'Maria Santos' }
          },
          {
            id: 3,
            amount: 1800.00,
            dueDate: '2024-12-20',
            status: 'paid',
            tenant: { name: 'Pedro Oliveira' }
          }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
      // Usar dados de teste em caso de erro
      setPayments([
        {
          id: 1,
          amount: 1500.00,
          dueDate: '2025-01-15',
          status: 'pending',
          tenant: { name: 'João Silva' }
        },
        {
          id: 2,
          amount: 2200.00,
          dueDate: '2025-01-10',
          status: 'pending',
          tenant: { name: 'Maria Santos' }
        }
      ])
    } finally {
      setLoading(false)
    }
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
    if (!selectedPayment) return

    try {
      let receiptUrl = ''
      
      // Use the actual uploaded file URL for preview
      if (uploadedFile) {
        receiptUrl = uploadedFileUrl || URL.createObjectURL(uploadedFile)
      }

      // Simulate API call - update payment in local state
      const updatedPayments = payments.map(payment => {
        if (payment.id === selectedPayment.id) {
          return {
            ...payment,
            status: 'paid',
            paidAt: new Date().toISOString().split('T')[0],
            receiptUrl,
            paymentMethod,
            notes
          }
        }
        return payment
      })
      
      setPayments(updatedPayments)
      setShowModal(false)
      setSelectedPayment(null)
      setNotes('')
      setPaymentMethod('dinheiro')
      
      // Don't revoke the URL since it's now being used by the payment
      setUploadedFile(null)
      setUploadedFileUrl('')
      
      alert('Pagamento marcado como pago!')
      
    } catch (error) {
      console.error('Erro ao marcar pagamento:', error)
      alert('Erro ao processar pagamento')
    }
  }

  const calculateTotal = (payment) => {
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
    return new Date(dateString).toLocaleDateString('pt-BR')
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
        return status
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
    const today = new Date()
    const due = new Date(dueDate)
    return today > due
  }

  const getDaysOverdue = (dueDate) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Stats calculation
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
    paid: payments.filter(p => p.status === 'paid').length,
    totalAmount: payments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments
      .filter(p => p.status === 'paid')
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Valor em Aberto</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.totalAmount.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
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
                placeholder="Buscar por inquilino ou imóvel..."
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
              <div key={payment.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <DollarSign className="w-5 h-5" style={{color: '#ff4352'}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {payment.property.title}
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
                          <div className="text-xs text-gray-500 mb-1">Inquilino:</div>
                          <div className="flex items-center text-gray-900">
                            <User className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{payment.tenant.name}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Vencimento:</div>
                          <div className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{formatDate(payment.dueDate)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Valor:</div>
                          <div className="flex items-center text-gray-900">
                            <span className="font-bold">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Endereço:</div>
                          <div className="flex items-center text-gray-900">
                            <span className="truncate text-sm">{payment.property.address}</span>
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
                        <CreditCard className="w-4 h-4" />
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
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pagamento encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Nenhum pagamento foi encontrado no sistema.'}
            </p>
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
          zIndex: 1000
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
              <p><strong>Inquilino:</strong> {selectedPayment.tenant?.name}</p>
              <p><strong>Valor Original:</strong> R$ {selectedPayment.amount?.toFixed(2)}</p>
              <p><strong>Vencimento:</strong> {new Date(selectedPayment.dueDate).toLocaleDateString('pt-BR')}</p>
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
                Valor com multa e juros: R$ {calculateTotal(selectedPayment).toFixed(2)}
              </label>
              
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="interestOption"
                  checked={!includeInterest}
                  onChange={() => setIncludeInterest(false)}
                  style={{ marginRight: '8px' }}
                />
                Apenas valor original: R$ {selectedPayment.amount?.toFixed(2)}
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
                  removeUploadedFile()
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
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Confirmar Pagamento
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
          zIndex: 1000
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
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Inquilino:</strong> {viewingReceipt.tenant.name}</p>
              <p><strong>Imóvel:</strong> {viewingReceipt.property.title}</p>
              <p><strong>Valor:</strong> R$ {viewingReceipt.amount.toFixed(2)}</p>
              <p><strong>Data do Pagamento:</strong> {viewingReceipt.paidAt ? new Date(viewingReceipt.paidAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>

            {viewingReceipt.receiptUrl && (
              <div style={{ textAlign: 'center' }}>
                {viewingReceipt.receiptUrl.endsWith('.pdf') ? (
                  <div>
                    <FileText size={48} style={{ margin: '20px auto', color: '#666' }} />
                    <p>Arquivo PDF</p>
                    <a 
                      href={viewingReceipt.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        marginTop: '10px'
                      }}
                    >
                      Abrir PDF
                    </a>
                  </div>
                ) : (
                  <div>
                    <img 
                      src={viewingReceipt.receiptUrl} 
                      alt="Comprovante de pagamento" 
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        borderRadius: '5px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <div style={{ display: 'none', textAlign: 'center', padding: '40px' }}>
                      <FileText size={48} style={{ margin: '20px auto', color: '#666' }} />
                      <p>Não foi possível carregar a imagem</p>
                      <small style={{ color: '#666' }}>{viewingReceipt.receiptUrl}</small>
                    </div>
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
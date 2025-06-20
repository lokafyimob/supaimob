'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: 'BOLETO' | 'PIX' | 'DINHEIRO' | 'TRANSFERENCIA' | 'CARTAO'
  penalty?: number
  interest?: number
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentWithInterest, setPaymentWithInterest] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateLateFees = (payment: Payment) => {
    if (payment.status === 'PAID') {
      return { penalty: payment.penalty || 0, interest: payment.interest || 0, total: payment.amount }
    }

    const dueDate = new Date(payment.dueDate)
    const currentDate = new Date()
    const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    if (daysPastDue <= 0) {
      return { penalty: 0, interest: 0, total: payment.amount }
    }

    const penalty = payment.amount * 0.02 // 2%
    const interest = payment.amount * 0.00033 * daysPastDue // 0.033% per day
    const total = payment.amount + penalty + interest

    return {
      penalty: Math.round(penalty * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      total: Math.round(total * 100) / 100
    }
  }

  const handleMarkAsPaid = (payment: Payment) => {
    setEditingPayment(payment)
    setShowPaymentModal(true)
    setPaymentMethod('')
    setPaymentWithInterest(true)
  }

  const handleSavePayment = async () => {
    if (!editingPayment || !paymentMethod) return

    try {
      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: editingPayment.id,
          paymentMethod: paymentMethod,
          includeInterest: paymentWithInterest
        })
      })

      if (response.ok) {
        fetchPayments()
        setShowPaymentModal(false)
        setEditingPayment(null)
      }
    } catch (error) {
      console.error('Error saving payment:', error)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os pagamentos de aluguel</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Inquilino / Imóvel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => {
                  const lateFees = calculateLateFees(payment)
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.contract.tenant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.contract.property.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {payment.amount.toLocaleString('pt-BR')}
                        </div>
                        {(lateFees.penalty > 0 || lateFees.interest > 0) && (
                          <div className="text-xs text-red-600">
                            Total: R$ {lateFees.total.toLocaleString('pt-BR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status === 'PAID' ? 'Pago' :
                           payment.status === 'PENDING' ? 'Pendente' :
                           payment.status === 'OVERDUE' ? 'Em Atraso' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {payment.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkAsPaid(payment)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Marcar como Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pagamento encontrado
            </h3>
            <p className="text-gray-600">
              Não há pagamentos cadastrados para este usuário.
            </p>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && editingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Marcar Pagamento como Pago
                </h2>

                <div className="mb-4">
                  <p><strong>Inquilino:</strong> {editingPayment.contract.tenant.name}</p>
                  <p><strong>Valor:</strong> R$ {editingPayment.amount.toLocaleString('pt-BR')}</p>
                </div>

                {(() => {
                  const lateFees = calculateLateFees(editingPayment)
                  if (lateFees.penalty > 0 || lateFees.interest > 0) {
                    return (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor a ser Registrado
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="paymentAmount"
                              checked={paymentWithInterest}
                              onChange={() => setPaymentWithInterest(true)}
                              className="mr-2"
                            />
                            <span>Valor com multa e juros: R$ {lateFees.total.toLocaleString('pt-BR')}</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="paymentAmount"
                              checked={!paymentWithInterest}
                              onChange={() => setPaymentWithInterest(false)}
                              className="mr-2"
                            />
                            <span>Apenas valor original: R$ {editingPayment.amount.toLocaleString('pt-BR')}</span>
                          </label>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    <option value="PIX">PIX</option>
                    <option value="TRANSFERENCIA">Transferência Bancária</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CARTAO">Cartão</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={!paymentMethod}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Salvar
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
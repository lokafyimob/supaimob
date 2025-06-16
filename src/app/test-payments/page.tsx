'use client'

import { useState } from 'react'
import { CheckCircle, Image, X, Upload } from 'lucide-react'

interface TestPayment {
  id: string
  amount: number
  status: 'PENDING' | 'PAID'
  tenant: string
  property: string
  paymentMethod?: string
  receipts?: string[]
}

export default function TestPayments() {
  const [payments, setPayments] = useState<TestPayment[]>([
    {
      id: '1',
      amount: 2500,
      status: 'PENDING',
      tenant: 'João Silva',
      property: 'Apartamento Centro'
    },
    {
      id: '2', 
      amount: 1800,
      status: 'PENDING',
      tenant: 'Maria Santos',
      property: 'Casa Jardim'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<TestPayment | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [receipts, setReceipts] = useState<string[]>([])

  const markAsPaid = (payment: TestPayment) => {
    setEditingPayment(payment)
    setShowModal(true)
    setPaymentMethod('')
    setReceipts([])
  }

  const savePayment = () => {
    if (!editingPayment || !paymentMethod) return

    const updatedPayments = payments.map(p => 
      p.id === editingPayment.id 
        ? { 
            ...p, 
            status: 'PAID' as const,
            paymentMethod,
            receipts: receipts.length > 0 ? receipts : ['comprovante-teste.jpg']
          }
        : p
    )

    setPayments(updatedPayments)
    setShowModal(false)
    setEditingPayment(null)
    alert('Pagamento marcado como pago!')
  }

  const addReceipt = () => {
    setReceipts([...receipts, `comprovante-${Date.now()}.jpg`])
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Pagamentos</h1>
      
      <div className="space-y-4">
        {payments.map(payment => (
          <div key={payment.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{payment.tenant}</p>
              <p className="text-sm text-gray-600">{payment.property}</p>
              <p className="text-lg font-bold">R$ {payment.amount.toLocaleString('pt-BR')}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                payment.status === 'PAID' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {payment.status === 'PAID' ? 'Pago' : 'Pendente'}
              </span>
              
              {payment.status === 'PENDING' && (
                <button
                  onClick={() => markAsPaid(payment)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Marcar como Pago
                </button>
              )}
              
              {payment.status === 'PAID' && payment.receipts && (
                <button className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                  <Image className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Marcar como Pago</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Forma de Pagamento *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione</option>
                  <option value="PIX">PIX</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Comprovantes
                </label>
                <button
                  onClick={addReceipt}
                  className="w-full border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-gray-400"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  Adicionar Comprovante
                </button>
                
                {receipts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {receipts.map((receipt, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        📄 {receipt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={savePayment}
                  disabled={!paymentMethod}
                  className="flex-1 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
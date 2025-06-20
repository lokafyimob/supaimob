'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [includeInterest, setIncludeInterest] = useState(true)

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
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async () => {
    if (!selectedPayment || !paymentMethod) return

    try {
      const response = await fetch('/api/payments/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          paymentMethod: paymentMethod,
          includeInterest: includeInterest
        })
      })

      if (response.ok) {
        fetchPayments()
        setShowModal(false)
        setSelectedPayment(null)
        setPaymentMethod('')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div>Carregando...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <h1>Pagamentos</h1>
        <p>Gerencie todos os pagamentos de aluguel</p>

        <div>
          <table>
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.contract?.tenant?.name || 'N/A'}</td>
                  <td>R$ {payment.amount?.toLocaleString('pt-BR') || '0'}</td>
                  <td>{payment.status}</td>
                  <td>
                    {payment.status !== 'PAID' && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowModal(true)
                        }}
                      >
                        Marcar como Pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h2>Marcar Pagamento como Pago</h2>
              
              <p>Inquilino: {selectedPayment.contract?.tenant?.name}</p>
              <p>Valor: R$ {selectedPayment.amount?.toLocaleString('pt-BR')}</p>

              <div>
                <label>
                  <input
                    type="radio"
                    name="interest"
                    checked={includeInterest}
                    onChange={() => setIncludeInterest(true)}
                  />
                  Com juros e multa
                </label>
              </div>
              
              <div>
                <label>
                  <input
                    type="radio"
                    name="interest"
                    checked={!includeInterest}
                    onChange={() => setIncludeInterest(false)}
                  />
                  Apenas valor original
                </label>
              </div>

              <div>
                <label>Forma de Pagamento:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="PIX">PIX</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>

              <div>
                <button onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button 
                  onClick={markAsPaid}
                  disabled={!paymentMethod}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'

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
    return <div>Carregando pagamentos...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Pagamentos</h1>
      <p>Gerencie todos os pagamentos de aluguel</p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Inquilino</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Valor</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={payment.id || index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {payment.contract?.tenant?.name || 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                R$ {payment.amount?.toLocaleString('pt-BR') || '0'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {payment.status || 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {payment.status !== 'PAID' && (
                  <button
                    onClick={() => {
                      setSelectedPayment(payment)
                      setShowModal(true)
                    }}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer'
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

      {payments.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h3>Nenhum pagamento encontrado</h3>
          <p>Não há pagamentos cadastrados para este usuário.</p>
        </div>
      )}

      {/* Payment Modal */}
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
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Marcar Pagamento como Pago</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Inquilino:</strong> {selectedPayment.contract?.tenant?.name}</p>
              <p><strong>Valor Original:</strong> R$ {selectedPayment.amount?.toLocaleString('pt-BR')}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Valor a ser Registrado:</h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="interest"
                    checked={includeInterest}
                    onChange={() => setIncludeInterest(true)}
                    style={{ marginRight: '8px' }}
                  />
                  Valor com multa e juros (recomendado)
                </label>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="interest"
                    checked={!includeInterest}
                    onChange={() => setIncludeInterest(false)}
                    style={{ marginRight: '8px' }}
                  />
                  Apenas valor original (sem juros)
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Forma de Pagamento:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecione a forma de pagamento</option>
                <option value="PIX">PIX</option>
                <option value="TRANSFERENCIA">Transferência Bancária</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={markAsPaid}
                disabled={!paymentMethod}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  backgroundColor: paymentMethod ? '#28a745' : '#ccc',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: paymentMethod ? 'pointer' : 'not-allowed'
                }}
              >
                Marcar como Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'

export default function Payments() {
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [includeInterest, setIncludeInterest] = useState(true)

  const handleMarkAsPaid = () => {
    setShowModal(true)
  }

  const handleSave = () => {
    // TODO: API call will be added later
    console.log('Payment method:', paymentMethod)
    console.log('Include interest:', includeInterest)
    setShowModal(false)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Pagamentos</h1>
      <p>Sistema de gestão de pagamentos com opções de juros</p>

      {/* Exemplo de pagamento */}
      <div style={{ border: '1px solid #ddd', padding: '15px', marginTop: '20px', borderRadius: '5px' }}>
        <h3>João Silva - Apartamento 101</h3>
        <p>Valor: R$ 1.500,00</p>
        <p>Status: Pendente</p>
        <button 
          onClick={handleMarkAsPaid}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Marcar como Pago
        </button>
      </div>

      {/* Modal de Pagamento */}
      {showModal && (
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
            <h2>Marcar Pagamento como Pago</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Inquilino:</strong> João Silva</p>
              <p><strong>Valor Original:</strong> R$ 1.500,00</p>
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
                  Valor com multa e juros (R$ 1.650,00)
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
                  Apenas valor original (R$ 1.500,00)
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
                onClick={handleSave}
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
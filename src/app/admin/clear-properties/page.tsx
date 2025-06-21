'use client'

import { useState } from 'react'

export default function ClearPropertiesPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [count, setCount] = useState<number | null>(null)

  const checkCount = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/clear-properties')
      const data = await response.json()
      
      if (data.success) {
        setCount(data.count)
        setMessage(data.message)
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      setMessage('Erro ao verificar propriedades: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const clearProperties = async () => {
    if (!confirm('Tem certeza que deseja limpar TODAS as propriedades?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/clear-properties', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage(data.message)
        setCount(0)
      } else {
        setMessage(data.error)
      }
    } catch (error) {
      setMessage('Erro ao limpar propriedades: ' + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Administração - Limpar Propriedades</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={checkCount}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Verificando...' : 'Verificar Quantidade'}
        </button>
        
        <button 
          onClick={clearProperties}
          disabled={loading || count === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading || count === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Limpando...' : 'Limpar Todas as Propriedades'}
        </button>
      </div>

      {count !== null && (
        <div style={{
          padding: '15px',
          backgroundColor: count > 0 ? '#fff3cd' : '#d1edff',
          border: `1px solid ${count > 0 ? '#ffeaa7' : '#bee5eb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Propriedades no banco: {count}</strong>
        </div>
      )}

      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        <p><strong>⚠️ ATENÇÃO:</strong> Esta operação é irreversível!</p>
        <p>Todas as propriedades serão removidas permanentemente do banco de dados.</p>
      </div>
    </div>
  )
}
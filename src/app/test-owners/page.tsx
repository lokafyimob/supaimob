'use client'

import { useState } from 'react'

export default function TestOwners() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const createOwner = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'João Silva',
          email: 'joao@teste.com',
          phone: '11999999999',
          document: '12345678901',
          address: 'Rua Teste, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        })
      })
      
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Erro: ' + error)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste Cadastro de Proprietário</h1>
      
      <button 
        onClick={createOwner}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testando...' : 'Testar Cadastro'}
      </button>
      
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {result}
        </pre>
      )}
    </div>
  )
}
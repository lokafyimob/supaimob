'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function TestLeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'RENT',
    propertyType: 'APARTMENT',
    maxPrice: '1000'
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      console.log('Submitting test lead:', formData)
      
      const response = await fetch('/api/leads/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          maxPrice: parseFloat(formData.maxPrice)
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ Sucesso! Lead criado com ID: ${data.lead.id}`)
        setFormData({
          name: '',
          email: '',
          phone: '',
          interest: 'RENT',
          propertyType: 'APARTMENT',
          maxPrice: '1000'
        })
      } else {
        setResult(`❌ Erro: ${data.error} - ${data.details}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setResult(`❌ Erro de conexão: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Teste de Criação de Lead</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Interesse</label>
            <select
              value={formData.interest}
              onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="RENT">Aluguel</option>
              <option value="BUY">Compra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Imóvel</label>
            <select
              value={formData.propertyType}
              onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="APARTMENT">Apartamento</option>
              <option value="HOUSE">Casa</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="LAND">Terreno</option>
              <option value="STUDIO">Studio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Orçamento Máximo</label>
            <input
              type="number"
              value={formData.maxPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              min="1"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? 'Criando...' : 'Criar Lead de Teste'}
          </button>
        </form>

        {result && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function RawTestForm() {
  const [formData, setFormData] = useState({
    name: 'João Silva',
    email: 'joao@teste.com',
    phone: '11999888777'
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      console.log('Submitting raw test lead:', formData)
      
      const response = await fetch('/api/leads/raw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(`✅ SUCESSO! Lead criado via SQL bruto:
ID: ${data.lead.id}
Nome: ${data.lead.name}
Email: ${data.lead.email}
Método: ${data.method}`)
      } else {
        setResult(`❌ ERRO SQL:
Tipo: ${data.error}
Detalhes: ${data.details}
Código: ${data.code || 'N/A'}`)
      }
    } catch (error) {
      setResult(`❌ ERRO DE CONEXÃO:
${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4 text-red-600">🔧 Teste SQL Bruto - Diagnóstico Final</h1>
        <p className="text-sm text-gray-600 mb-6">
          Este teste bypassa completamente o Prisma e usa SQL direto no PostgreSQL.
          Se falhar aqui, o problema é no banco de dados ou schema.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {loading ? '🔄 Testando SQL Bruto...' : '🚀 Executar Teste SQL Bruto'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">Resultado:</h3>
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-bold text-blue-800 mb-2">O que este teste verifica:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Conexão direta com PostgreSQL</li>
            <li>✓ Schema da tabela 'leads'</li>
            <li>✓ Permissões de INSERT</li>
            <li>✓ Tipos de dados e constraints</li>
            <li>✓ Relacionamento com usuário/company</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
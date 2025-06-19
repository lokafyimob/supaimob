'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'

export default function MigratePage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(data)
      } else {
        setError(data.error || 'Erro na migração')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const testEndpoint = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('/api/migrate')
      const data = await response.json()
      setResults(data)
    } catch {
      setError('Erro ao testar endpoint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Migração do Banco de Dados
          </h1>
          
          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              Esta página permite executar a migração do banco de dados para adicionar 
              as colunas que estão faltando e corrigir problemas de schema.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Atenção</h3>
              <p className="text-yellow-700">
                Esta operação irá modificar a estrutura do banco de dados. 
                Execute apenas se estiver enfrentando erros de &quot;coluna não existe&quot;.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={testEndpoint}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Testando...' : 'Testar Endpoint'}
              </button>
              
              <button
                onClick={runMigration}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Executando...' : 'Executar Migração'}
              </button>
            </div>

            {loading && (
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Processando...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Erro</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {results && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-4">✅ Resultados</h3>
                
                {results.message && (
                  <p className="text-green-700 mb-4 font-medium">{results.message}</p>
                )}
                
                {results.timestamp && (
                  <p className="text-green-600 mb-4">
                    <strong>Timestamp:</strong> {results.timestamp}
                  </p>
                )}

                {results.results && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800">Operações realizadas:</h4>
                    <ul className="space-y-1">
                      {results.results.map((result: string, index: number) => (
                        <li key={index} className="text-green-700 font-mono text-sm">
                          {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.success !== undefined && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm">
                      <strong>Status:</strong> {results.success ? 'Sucesso' : 'Falha'}
                    </p>
                    {results.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Detalhes:</strong> {results.details}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">O que esta migração faz:</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Torna o campo <code className="bg-gray-100 px-1 rounded">owners.companyId</code> anulável</li>
              <li>• Adiciona coluna <code className="bg-gray-100 px-1 rounded">properties.images</code></li>
              <li>• Adiciona coluna <code className="bg-gray-100 px-1 rounded">properties.amenities</code></li>
              <li>• Adiciona colunas faltantes na tabela <code className="bg-gray-100 px-1 rounded">contracts</code></li>
              <li>• Adiciona colunas faltantes na tabela <code className="bg-gray-100 px-1 rounded">payments</code></li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 <strong>Dica:</strong> Após executar a migração com sucesso, 
              tente criar um proprietário novamente em /owners
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { X, Bot, Loader2 } from 'lucide-react'

interface AIContractFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Property {
  id: string
  title: string
  address: string
  propertyType: string
  rentPrice: number
  owner: {
    id: string
    name: string
  }
}

interface Tenant {
  id: string
  name: string
  email: string
  phone: string
  document: string
}

export function AIContractForm({ isOpen, onClose, onSuccess }: AIContractFormProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    depositAmount: '',
    specialTerms: ''
  })

  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [generatedContract, setGeneratedContract] = useState<string>('')
  const [showContract, setShowContract] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadData()
      resetForm()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/tenants')
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        // Filter available properties
        const availableProperties = propertiesData.filter((p: Property) => p.propertyType)
        setProperties(availableProperties)
      }

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json()
        setTenants(tenantsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contracts/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount),
          depositAmount: parseFloat(formData.depositAmount),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString()
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setGeneratedContract(result.generatedText)
        setShowContract(true)
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating contract:', error)
      alert('Erro ao gerar contrato')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      propertyId: '',
      tenantId: '',
      startDate: '',
      endDate: '',
      rentAmount: '',
      depositAmount: '',
      specialTerms: ''
    })
    setGeneratedContract('')
    setShowContract(false)
  }

  const handlePropertyChange = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.id === propertyId)
    if (selectedProperty) {
      setFormData(prev => ({
        ...prev,
        propertyId,
        rentAmount: selectedProperty.rentPrice.toString(),
        depositAmount: selectedProperty.rentPrice.toString() // Default deposit = 1 month rent
      }))
    }
  }

  const calculateEndDate = (startDate: string, months: number = 12) => {
    if (!startDate) return ''
    const start = new Date(startDate)
    const end = new Date(start)
    end.setMonth(start.getMonth() + months)
    return end.toISOString().split('T')[0]
  }

  const downloadContract = () => {
    const blob = new Blob([generatedContract], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contrato-gerado-ia.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Gerador de Contratos com IA
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {showContract ? (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contrato Gerado</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {generatedContract}
                </pre>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowContract(false)}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={downloadContract}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Baixar Contrato
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <>
            {loadingData ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="text-sm font-medium text-purple-900">IA Inteligente</h4>
                      <p className="text-sm text-purple-700">
                        Nossa IA criará um contrato personalizado e juridicamente válido com base nos dados fornecidos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seleção de Imóvel e Inquilino */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imóvel *
                      </label>
                      <select
                        value={formData.propertyId}
                        onChange={(e) => handlePropertyChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione um imóvel</option>
                        {properties.map((property) => (
                          <option key={property.id} value={property.id}>
                            {property.title} - {property.address}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inquilino *
                      </label>
                      <select
                        value={formData.tenantId}
                        onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecione um inquilino</option>
                        {tenants.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name} - {tenant.document}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Período e Valores */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Período e Valores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Início *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            startDate: e.target.value,
                            endDate: calculateEndDate(e.target.value)
                          }))
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Término *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor do Aluguel (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.rentAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="2500.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor do Depósito (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="2500.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        endDate: calculateEndDate(prev.startDate, 6)
                      }))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      6 meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        endDate: calculateEndDate(prev.startDate, 12)
                      }))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      12 meses
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        endDate: calculateEndDate(prev.startDate, 24)
                      }))}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      24 meses
                    </button>
                  </div>
                </div>

                {/* Termos Especiais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termos Especiais (Opcional)
                  </label>
                  <textarea
                    value={formData.specialTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialTerms: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Adicione cláusulas especiais ou condições específicas para este contrato..."
                  />
                </div>

                {/* Botões */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Gerar Contrato com IA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
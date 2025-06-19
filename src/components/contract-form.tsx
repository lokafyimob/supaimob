'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { calculateContractEndDate } from '../lib/date-utils'

interface ContractFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, any>) => void
  contract?: Record<string, any>
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

export function ContractForm({ isOpen, onClose, onSubmit, contract }: ContractFormProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    depositAmount: '',
    administrationFeePercentage: '10',
    terms: '',
    status: 'ACTIVE'
  })

  const [properties, setProperties] = useState<Property[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadData()
      if (contract) {
        setFormData({
          propertyId: contract.propertyId || '',
          tenantId: contract.tenantId || '',
          startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
          endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
          rentAmount: contract.rentAmount?.toString() || '',
          depositAmount: contract.depositAmount?.toString() || '',
          administrationFeePercentage: contract.administrationFeePercentage?.toString() || '10',
          terms: contract.terms || '',
          status: contract.status || 'ACTIVE'
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, contract]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      // Load properties and tenants
      const [propertiesRes, tenantsRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/tenants')
      ])

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json()
        // Filter only available properties for new contracts
        const availableProperties = contract ? propertiesData : propertiesData.filter((p: Property) => p.propertyType)
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
  }, [contract])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        rentAmount: parseFloat(formData.rentAmount),
        depositAmount: parseFloat(formData.depositAmount),
        administrationFeePercentage: parseFloat(formData.administrationFeePercentage),
        startDate: formData.startDate,
        endDate: formData.endDate
      }

      await onSubmit(submitData)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error submitting form:', error)
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
      administrationFeePercentage: '10',
      terms: '',
      status: 'ACTIVE'
    })
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
    // Usar função utilitária para cálculo seguro da data final
    const end = calculateContractEndDate(start, months)
    return end.toISOString().split('T')[0]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {contract ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione um imóvel</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} - {property.address} (R$ {property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Status do Contrato */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status do Contrato</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="EXPIRED">Expirado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="RENEWED">Renovado</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Status atual do contrato de locação
                </p>
              </div>
            </div>

            {/* Período do Contrato */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Período do Contrato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Valores */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Aluguel (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, rentAmount: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2500.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Administração (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.administrationFeePercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, administrationFeePercentage: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10.00"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Porcentagem sobre o valor do aluguel
                  </p>
                </div>
              </div>
              
              {formData.rentAmount && formData.administrationFeePercentage && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Resumo de Valores:</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Valor do Aluguel:</span>
                      <span>R$ {parseFloat(formData.rentAmount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Administração ({formData.administrationFeePercentage}%):</span>
                      <span>R$ {(parseFloat(formData.rentAmount || '0') * parseFloat(formData.administrationFeePercentage || '0') / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <hr className="border-green-300 my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total para o Proprietário:</span>
                      <span>R$ {(parseFloat(formData.rentAmount || '0') - (parseFloat(formData.rentAmount || '0') * parseFloat(formData.administrationFeePercentage || '0') / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Termos do Contrato */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Termos do Contrato</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cláusulas e Condições
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite os termos e condições específicos do contrato..."
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Cláusulas Padrão Incluídas:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Locação conforme Lei 8.245/91 (Lei do Inquilinato)</li>
                  <li>• Reajuste anual conforme IGP-M ou IPCA</li>
                  <li>• Vencimento do aluguel no dia 10 de cada mês</li>
                  <li>• Multa de 10% por atraso no pagamento</li>
                  <li>• Caução equivalente a 1 mês de aluguel</li>
                </ul>
              </div>
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
                className="px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: loading ? '#d1d5db' : '#ff4352'}}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLButtonElement
                  if (!loading) {
                    target.style.backgroundColor = '#e03e4d'
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLButtonElement
                  if (!loading) {
                    target.style.backgroundColor = '#ff4352'
                  }
                }}
              >
                {loading ? 'Salvando...' : contract ? 'Atualizar' : 'Criar Contrato'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface LeadFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  lead?: any
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'COMMERCIAL', label: 'Comercial' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'STUDIO', label: 'Studio' }
]

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const COMMON_AMENITIES = [
  'Piscina', 'Academia', 'Portaria 24h', 'Playground', 'Churrasqueira',
  'Elevador', 'Garagem', 'Quintal', 'Varanda', 'Ar condicionado',
  'Mobiliado', 'Segurança', 'Estacionamento', 'Internet', 'Lavabo'
]

export function LeadForm({ isOpen, onClose, onSubmit, lead }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    interest: 'RENT',
    propertyType: 'APARTMENT',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: '',
    minBathrooms: '',
    maxBathrooms: '',
    minArea: '',
    maxArea: '',
    preferredCities: [''],
    preferredStates: [] as string[],
    amenities: [] as string[],
    notes: '',
    status: 'ACTIVE',
    lastContactDate: ''
  })

  const [loading, setLoading] = useState(false)
  const [displayValues, setDisplayValues] = useState({
    phone: '',
    document: '',
    minPrice: '',
    maxPrice: ''
  })
  
  // Funções de formatação
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length === 0) return ''
    if (numbers.length <= 2) return `(${numbers}`
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      if (numbers.length === 0) return ''
      if (numbers.length <= 3) return numbers
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
    } else {
      // CNPJ: 00.000.000/0000-00
      const cnpj = numbers.slice(0, 14)
      if (cnpj.length <= 2) return cnpj
      if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`
      if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`
      if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    const numberValue = parseInt(numbers) / 100
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const parseCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers === '' ? '' : (parseInt(numbers) / 100).toString()
  }

  useEffect(() => {
    if (isOpen) {
      if (lead) {
        setFormData({
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          document: lead.document || '',
          interest: lead.interest || 'RENT',
          propertyType: lead.propertyType || 'APARTMENT',
          minPrice: lead.minPrice?.toString() || '',
          maxPrice: lead.maxPrice?.toString() || '',
          minBedrooms: lead.minBedrooms?.toString() || '',
          maxBedrooms: lead.maxBedrooms?.toString() || '',
          minBathrooms: lead.minBathrooms?.toString() || '',
          maxBathrooms: lead.maxBathrooms?.toString() || '',
          minArea: lead.minArea?.toString() || '',
          maxArea: lead.maxArea?.toString() || '',
          preferredCities: JSON.parse(lead.preferredCities || '[""]'),
          preferredStates: JSON.parse(lead.preferredStates || '[]'),
          amenities: JSON.parse(lead.amenities || '[]'),
          notes: lead.notes || '',
          status: lead.status || 'ACTIVE',
          lastContactDate: lead.lastContactDate ? lead.lastContactDate.split('T')[0] : ''
        })
        
        setDisplayValues({
          phone: lead.phone || '',
          document: lead.document || '',
          minPrice: lead.minPrice ? lead.minPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
          maxPrice: lead.maxPrice ? lead.maxPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, lead])

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      interest: 'RENT',
      propertyType: 'APARTMENT',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      maxBedrooms: '',
      minBathrooms: '',
      maxBathrooms: '',
      minArea: '',
      maxArea: '',
      preferredCities: [''],
      preferredStates: [],
      amenities: [],
      notes: '',
      status: 'ACTIVE',
      lastContactDate: ''
    })
    setDisplayValues({
      phone: '',
      document: '',
      minPrice: '',
      maxPrice: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        maxPrice: parseFloat(formData.maxPrice),
        minBedrooms: formData.minBedrooms ? parseInt(formData.minBedrooms) : null,
        maxBedrooms: formData.maxBedrooms ? parseInt(formData.maxBedrooms) : null,
        minBathrooms: formData.minBathrooms ? parseInt(formData.minBathrooms) : null,
        maxBathrooms: formData.maxBathrooms ? parseInt(formData.maxBathrooms) : null,
        minArea: formData.minArea ? parseFloat(formData.minArea) : null,
        maxArea: formData.maxArea ? parseFloat(formData.maxArea) : null,
        preferredCities: formData.preferredCities.filter(city => city.trim() !== ''),
        lastContactDate: formData.lastContactDate || null
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

  const addCity = () => {
    setFormData(prev => ({
      ...prev,
      preferredCities: [...prev.preferredCities, '']
    }))
  }

  const removeCity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredCities: prev.preferredCities.filter((_, i) => i !== index)
    }))
  }

  const updateCity = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCities: prev.preferredCities.map((city, i) => i === index ? value : city)
    }))
  }

  const toggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      preferredStates: prev.preferredStates.includes(state)
        ? prev.preferredStates.filter(s => s !== state)
        : [...prev.preferredStates, state]
    }))
  }

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {lead ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Pessoais */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={displayValues.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setDisplayValues(prev => ({ ...prev, phone: formatted }))
                    setFormData(prev => ({ ...prev, phone: formatted }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={displayValues.document}
                  onChange={(e) => {
                    const formatted = formatDocument(e.target.value)
                    setDisplayValues(prev => ({ ...prev, document: formatted }))
                    setFormData(prev => ({ ...prev, document: formatted }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
            </div>
          </div>

          {/* Interesse e Tipo */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Interesse do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interesse *
                </label>
                <select
                  value={formData.interest}
                  onChange={(e) => setFormData(prev => ({ ...prev, interest: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="RENT">Aluguel</option>
                  <option value="BUY">Compra</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Imóvel *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Faixa de Preço */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Faixa de Preço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Mínimo (R$)
                </label>
                <input
                  type="text"
                  value={displayValues.minPrice}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setDisplayValues(prev => ({ ...prev, minPrice: formatted }))
                    setFormData(prev => ({ ...prev, minPrice: parseCurrency(e.target.value) }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100.000,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Máximo (R$) *
                </label>
                <input
                  type="text"
                  value={displayValues.maxPrice}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setDisplayValues(prev => ({ ...prev, maxPrice: formatted }))
                    setFormData(prev => ({ ...prev, maxPrice: parseCurrency(e.target.value) }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500.000,00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Características do Imóvel */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Características Desejadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Quartos
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minBedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, minBedrooms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máx. Quartos
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxBedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBedrooms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Banheiros
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minBathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, minBathrooms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máx. Banheiros
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxBathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxBathrooms: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Mín. (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, minArea: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Máx. (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxArea: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Localização Preferida */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Localização Preferida</h3>
            
            {/* Cidades */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidades Preferidas
              </label>
              {formData.preferredCities.map((city, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => updateCity(index, e.target.value)}
                    placeholder="Nome da cidade"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.preferredCities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCity(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCity}
                className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar cidade
              </button>
            </div>

            {/* Estados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estados Preferidos
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
                {BRAZIL_STATES.map(state => (
                  <label key={state} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferredStates.includes(state)}
                      onChange={() => toggleState(state)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{state}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Comodidades */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comodidades Desejadas</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {COMMON_AMENITIES.map(amenity => (
                <label key={amenity} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status e Observações */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <option value="CONVERTED">Convertido</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="ARCHIVED">Arquivado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Último Contato
                </label>
                <input
                  type="date"
                  value={formData.lastContactDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastContactDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Observações adicionais sobre o cliente e suas preferências..."
              />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : lead ? 'Atualizar Lead' : 'Criar Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
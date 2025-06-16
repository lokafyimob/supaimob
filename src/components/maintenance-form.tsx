'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Calendar } from 'lucide-react'

interface MaintenanceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  maintenance?: any
  contractId?: string
  propertyId?: string
}

const maintenanceTypes = [
  { value: 'PLUMBING', label: 'Hidráulica' },
  { value: 'ELECTRICAL', label: 'Elétrica' },
  { value: 'PAINTING', label: 'Pintura' },
  { value: 'CLEANING', label: 'Limpeza' },
  { value: 'APPLIANCE_REPAIR', label: 'Reparo de Eletrodomésticos' },
  { value: 'STRUCTURAL', label: 'Estrutural' },
  { value: 'GARDEN', label: 'Jardim' },
  { value: 'SECURITY', label: 'Segurança' },
  { value: 'HVAC', label: 'Ar Condicionado/Aquecimento' },
  { value: 'GENERAL', label: 'Geral' },
  { value: 'OTHER', label: 'Outros' }
]

const maintenanceCategories = [
  { value: 'PREVENTIVE', label: 'Preventiva' },
  { value: 'CORRECTIVE', label: 'Corretiva' },
  { value: 'EMERGENCY', label: 'Emergência' },
  { value: 'IMPROVEMENT', label: 'Melhoria' }
]

const maintenancePriorities = [
  { value: 'LOW', label: 'Baixa', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Média', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'Alta', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgente', color: 'text-red-600' }
]

const maintenanceStatuses = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'IN_PROGRESS', label: 'Em Andamento' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'ON_HOLD', label: 'Em Espera' }
]

export function MaintenanceForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  maintenance, 
  contractId, 
  propertyId 
}: MaintenanceFormProps) {
  const [formData, setFormData] = useState({
    contractId: contractId || '',
    propertyId: propertyId || '',
    type: 'GENERAL',
    category: 'CORRECTIVE',
    title: '',
    description: '',
    amount: '',
    supplier: '',
    supplierContact: '',
    scheduledDate: '',
    completedDate: '',
    status: 'PENDING',
    priority: 'MEDIUM',
    images: [] as string[],
    receipts: [] as string[],
    notes: '',
    approvedBy: '',
    deductFromOwner: true
  })

  const [loading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchContracts()
      if (maintenance) {
        const amountValue = maintenance.amount?.toString() || ''
        setFormData({
          contractId: maintenance.contractId || '',
          propertyId: maintenance.propertyId || '',
          type: maintenance.type || 'GENERAL',
          category: maintenance.category || 'CORRECTIVE',
          title: maintenance.title || '',
          description: maintenance.description || '',
          amount: amountValue,
          supplier: maintenance.supplier || '',
          supplierContact: maintenance.supplierContact || '',
          scheduledDate: maintenance.scheduledDate ? 
            new Date(maintenance.scheduledDate).toISOString().slice(0, 16) : '',
          completedDate: maintenance.completedDate ? 
            new Date(maintenance.completedDate).toISOString().slice(0, 16) : '',
          status: maintenance.status || 'PENDING',
          priority: maintenance.priority || 'MEDIUM',
          images: maintenance.images ? JSON.parse(maintenance.images) : [],
          receipts: maintenance.receipts ? JSON.parse(maintenance.receipts) : [],
          notes: maintenance.notes || '',
          approvedBy: maintenance.approvedBy || '',
          deductFromOwner: maintenance.deductFromOwner ?? true
        })
        // Format amount for display
        if (amountValue) {
          const valueInCents = Math.round(parseFloat(amountValue) * 100).toString()
          setDisplayAmount(formatCurrency(valueInCents))
        } else {
          setDisplayAmount('')
        }
      } else {
        resetForm()
      }
    }
  }, [isOpen, maintenance, contractId, propertyId])

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched contracts:', data)
        setContracts(data)
      } else {
        console.error('Error fetching contracts:', response.status)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      contractId: contractId || '',
      propertyId: propertyId || '',
      type: 'GENERAL',
      category: 'CORRECTIVE',
      title: '',
      description: '',
      amount: '',
      supplier: '',
      supplierContact: '',
      scheduledDate: '',
      completedDate: '',
      status: 'PENDING',
      priority: 'MEDIUM',
      images: [],
      receipts: [],
      notes: '',
      approvedBy: '',
      deductFromOwner: true
    })
    setDisplayAmount('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        scheduledDate: formData.scheduledDate || null,
        completedDate: formData.completedDate || null
      }

      console.log('Form submit data:', submitData)
      console.log('Amount before submit:', formData.amount, 'Parsed:', parseFloat(formData.amount))

      onSubmit(submitData)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
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

  const [displayAmount, setDisplayAmount] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {maintenance ? 'Editar Manutenção' : 'Nova Manutenção'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contract and Property */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrato *
              </label>
              <select
                value={formData.contractId}
                onChange={(e) => {
                  const selectedContract = contracts.find(c => c.id === e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    contractId: e.target.value,
                    propertyId: selectedContract?.propertyId || ''
                  }))
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!!contractId}
              >
                <option value="">Selecione um contrato</option>
                {contracts.map(contract => (
                  <option key={contract.id} value={contract.id}>
                    {contract.property.title} - {contract.tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Reparo vazamento torneira"
                required
              />
            </div>
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {maintenanceCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {maintenancePriorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva detalhadamente o problema ou serviço..."
              required
            />
          </div>

          {/* Amount and Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">R$</span>
                <input
                  type="text"
                  value={displayAmount}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setDisplayAmount(formatted)
                    setFormData(prev => ({ ...prev, amount: parseCurrency(e.target.value) }))
                  }}
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150,00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da empresa/prestador"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contato do Fornecedor
              </label>
              <input
                type="text"
                value={formData.supplierContact}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Telefone ou email"
              />
            </div>
          </div>

          {/* Dates and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Agendada
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Conclusão
              </label>
              <input
                type="datetime-local"
                value={formData.completedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {maintenanceStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deduct from Owner */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.deductFromOwner}
                onChange={(e) => setFormData(prev => ({ ...prev, deductFromOwner: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Deduzir do repasse ao proprietário</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Buttons */}
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
              {loading ? 'Salvando...' : maintenance ? 'Atualizar' : 'Criar Manutenção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
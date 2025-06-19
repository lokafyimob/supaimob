'use client'

import { useState, useEffect, useCallback } from 'react'
import { MaintenanceForm } from './maintenance-form'
import { 
  Wrench, 
  Plus, 
  Calendar, 
  DollarSign, 
  User, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Calculator
} from 'lucide-react'

interface ContractMaintenancesProps {
  contractId: string
  propertyId: string
}

interface Maintenance {
  id: string
  type: string
  category: string
  title: string
  description: string
  amount: number
  supplier?: string
  supplierContact?: string
  scheduledDate?: string
  completedDate?: string
  status: string
  priority: string
  deductFromOwner: boolean
  createdAt: string
  updatedAt: string
}

export function ContractMaintenances({ contractId, propertyId }: ContractMaintenancesProps) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    fetchMaintenances()
    generateCurrentMonthReport()
  }, [contractId, fetchMaintenances, generateCurrentMonthReport])

  const fetchMaintenances = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/maintenances?contractId=${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setMaintenances(data)
      }
    } catch (error) {
      console.error('Error fetching maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCurrentMonthReport = async () => {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      const response = await fetch(`/api/monthly-reports?action=generate&contractId=${contractId}&month=${month}&year=${year}`, {
        method: 'PUT'
      })
      
      if (response.ok) {
        const data = await response.json()
        setMonthlyReport(data)
      }
    } catch (error) {
      console.error('Error generating monthly report:', error)
    }
  }

  const handleCreateMaintenance = async (data: Record<string, any>) => {
    try {
      console.log('Sending maintenance data:', data)
      const response = await fetch('/api/maintenances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        showNotification('success', 'Manutenção criada com sucesso!')
        await fetchMaintenances()
        await generateCurrentMonthReport() // Recalculate report
        setShowForm(false)
      } else {
        console.error('Response status:', response.status)
        const responseText = await response.text()
        console.error('Response text:', responseText)
        
        let errorMessage = 'Erro desconhecido'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = responseText || errorMessage
        }
        
        showNotification('error', `Erro ao criar manutenção: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error creating maintenance:', error)
      showNotification('error', 'Erro ao criar manutenção')
    }
  }

  const handleUpdateMaintenance = async (data: any) => {
    try {
      const response = await fetch(`/api/maintenances/${editingMaintenance?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        showNotification('success', 'Manutenção atualizada com sucesso!')
        await fetchMaintenances()
        await generateCurrentMonthReport() // Recalculate report
        setEditingMaintenance(null)
        setShowForm(false)
      } else {
        showNotification('error', 'Erro ao atualizar manutenção')
      }
    } catch (error) {
      console.error('Error updating maintenance:', error)
      showNotification('error', 'Erro ao atualizar manutenção')
    }
  }

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta manutenção?')) return

    try {
      setDeletingId(id)
      const response = await fetch(`/api/maintenances/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('success', 'Manutenção excluída com sucesso!')
        await fetchMaintenances()
        await generateCurrentMonthReport() // Recalculate report
      } else {
        showNotification('error', 'Erro ao excluir manutenção')
      }
    } catch (error) {
      console.error('Error deleting maintenance:', error)
      showNotification('error', 'Erro ao excluir manutenção')
    } finally {
      setDeletingId(null)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente'
      case 'APPROVED': return 'Aprovada'
      case 'IN_PROGRESS': return 'Em Andamento'
      case 'COMPLETED': return 'Concluída'
      case 'CANCELLED': return 'Cancelada'
      case 'ON_HOLD': return 'Em Espera'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-gray-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HIGH': return 'text-orange-600'
      case 'URGENT': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Baixa'
      case 'MEDIUM': return 'Média'
      case 'HIGH': return 'Alta'
      case 'URGENT': return 'Urgente'
      default: return priority
    }
  }

  const getTypeLabel = (type: string) => {
    const types: {[key: string]: string} = {
      'PLUMBING': 'Hidráulica',
      'ELECTRICAL': 'Elétrica',
      'PAINTING': 'Pintura',
      'CLEANING': 'Limpeza',
      'APPLIANCE_REPAIR': 'Reparo de Eletrodomésticos',
      'STRUCTURAL': 'Estrutural',
      'GARDEN': 'Jardim',
      'SECURITY': 'Segurança',
      'HVAC': 'Ar Condicionado/Aquecimento',
      'GENERAL': 'Geral',
      'OTHER': 'Outros'
    }
    return types[type] || type
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }


  return (
    <div className="space-y-6">
      {/* Monthly Report Summary */}
      {monthlyReport && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" />
              Resumo Financeiro do Mês
            </h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={generateCurrentMonthReport}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors"
                title="Atualizar cálculos com dados mais recentes do contrato"
              >
                Atualizar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Aluguel Bruto</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(monthlyReport.grossAmount)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Taxa Adm.</p>
              <p className="text-lg font-bold text-orange-600">-{formatCurrency(monthlyReport.administrationFee)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Manutenções</p>
              <p className="text-lg font-bold text-red-600">-{formatCurrency(monthlyReport.maintenanceCosts)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Valor Líquido</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(monthlyReport.netAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Maintenances Section */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-gray-600" />
              Manutenções
              <span className="ml-2 bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {maintenances.length}
              </span>
            </h3>
            <button
              onClick={() => {
                setEditingMaintenance(null)
                setShowForm(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Manutenção
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : maintenances.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma manutenção registrada
              </h3>
              <p className="text-gray-600 mb-4">
                Registre as manutenções deste imóvel para controlar custos e repasses.
              </p>
              <button
                onClick={() => {
                  setEditingMaintenance(null)
                  setShowForm(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Primeira Manutenção
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenances.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="bg-gray-50 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{maintenance.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(maintenance.status)}`}>
                          {getStatusLabel(maintenance.status)}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(maintenance.priority)}`}>
                          {getPriorityLabel(maintenance.priority)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{maintenance.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatCurrency(maintenance.amount)}
                        </span>
                        <span>{getTypeLabel(maintenance.type)}</span>
                        {maintenance.supplier && (
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {maintenance.supplier}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(maintenance.createdAt)}
                        </span>
                        {maintenance.deductFromOwner && (
                          <span className="text-orange-600 text-xs bg-orange-100 px-2 py-1 rounded">
                            Dedutível
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingMaintenance(maintenance)
                          setShowForm(true)
                        }}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar manutenção"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaintenance(maintenance.id)}
                        disabled={deletingId === maintenance.id}
                        className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors ${
                          deletingId === maintenance.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Excluir manutenção"
                      >
                        {deletingId === maintenance.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Form Modal */}
      {showForm && (
        <MaintenanceForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingMaintenance(null)
          }}
          onSubmit={editingMaintenance ? handleUpdateMaintenance : handleCreateMaintenance}
          maintenance={editingMaintenance}
          contractId={contractId}
          propertyId={propertyId}
        />
      )}

      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
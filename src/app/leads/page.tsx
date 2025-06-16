'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { LeadForm } from '@/components/lead-form'
import { LeadMatchesModal } from '@/components/lead-matches-modal'
import { MatchAlert } from '@/components/match-alert'
import {
  Plus,
  Search,
  Filter,
  Users,
  Target,
  Phone,
  Mail,
  MapPin,
  Home,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Bell,
  CheckCircle,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  document?: string
  interest: 'RENT' | 'BUY'
  propertyType: string
  minPrice?: number
  maxPrice: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  minArea?: number
  maxArea?: number
  preferredCities: string
  preferredStates: string
  amenities?: string
  notes?: string
  status: 'ACTIVE' | 'CONVERTED' | 'INACTIVE' | 'ARCHIVED'
  lastContactDate?: string
  matchedPropertyId?: string
  createdAt: string
  updatedAt: string
  notifications: any[]
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterInterest, setFilterInterest] = useState<string>('all')
  const [showMatchesModal, setShowMatchesModal] = useState(false)
  const [selectedLeadForMatches, setSelectedLeadForMatches] = useState<Lead | null>(null)
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [matchCounts, setMatchCounts] = useState<{[leadId: string]: number}>({})
  const [newMatches, setNewMatches] = useState<{
    leadId: string
    leadName: string
    leadPhone: string
    propertyTitle: string
    propertyPrice: number
    matchType: 'RENT' | 'BUY'
  }[]>([])
  const [previousMatchCounts, setPreviousMatchCounts] = useState<{[leadId: string]: number}>({})

  useEffect(() => {
    fetchLeads(true) // Suppress alerts on initial load
  }, [])

  // Check for new matches periodically
  useEffect(() => {
    if (leads.length > 0) {
      const interval = setInterval(() => {
        // Only check if we're not currently loading
        if (!loading) {
          fetchMatchCounts(leads)
        }
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [leads, loading, previousMatchCounts])

  // Listen for property updates to immediately check for new matches
  useEffect(() => {
    const handlePropertyUpdate = () => {
      if (leads.length > 0 && !loading) {
        console.log('Property updated, checking for new matches...')
        fetchMatchCounts(leads)
      }
    }

    // Listen for custom property update events
    window.addEventListener('propertyUpdated', handlePropertyUpdate)
    window.addEventListener('propertyCreated', handlePropertyUpdate)

    return () => {
      window.removeEventListener('propertyUpdated', handlePropertyUpdate)
      window.removeEventListener('propertyCreated', handlePropertyUpdate)
    }
  }, [leads, loading])

  const fetchLeads = async (suppressAlerts = false) => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data)
        // Fetch match counts for all leads
        await fetchMatchCounts(data, suppressAlerts)
      } else {
        console.error('Error fetching leads:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchCounts = async (leadsData: Lead[], suppressAlerts = false) => {
    const counts: {[leadId: string]: number} = {}
    const detectedNewMatches: {
      leadId: string
      leadName: string
      leadPhone: string
      propertyTitle: string
      propertyPrice: number
      matchType: 'RENT' | 'BUY'
    }[] = []
    
    // Fetch matches for each active lead
    const activeLeads = leadsData.filter(lead => lead.status === 'ACTIVE')
    
    await Promise.all(
      activeLeads.map(async (lead) => {
        try {
          const response = await fetch(`/api/leads/${lead.id}/matches`)
          if (response.ok) {
            const matches = await response.json()
            counts[lead.id] = matches.length
            
            // Check if this lead has new matches compared to previous count
            const previousCount = previousMatchCounts[lead.id] || 0
            const currentCount = matches.length
            
            // If there are new matches, collect details for the first new match
            // Only show alerts if not suppressed and we have previous counts (not first load)
            if (!suppressAlerts && currentCount > previousCount && matches.length > 0 && Object.keys(previousMatchCounts).length > 0) {
              const latestMatch = matches[0] // Get the first (most recent) match
              const targetPrice = lead.interest === 'RENT' ? latestMatch.rentPrice : latestMatch.salePrice
              
              detectedNewMatches.push({
                leadId: lead.id,
                leadName: lead.name,
                leadPhone: lead.phone,
                propertyTitle: latestMatch.title,
                propertyPrice: targetPrice || 0,
                matchType: lead.interest as 'RENT' | 'BUY'
              })
            }
          } else {
            counts[lead.id] = 0
          }
        } catch (error) {
          console.error(`Error fetching matches for lead ${lead.id}:`, error)
          counts[lead.id] = 0
        }
      })
    )
    
    // Update counts and previous counts
    setMatchCounts(counts)
    setPreviousMatchCounts(counts)
    
    // Show new matches alert if any and not suppressed
    if (!suppressAlerts && detectedNewMatches.length > 0) {
      setNewMatches(detectedNewMatches)
    }
  }

  const handleCreateLead = async (leadData: any) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      })

      if (response.ok) {
        showNotification('success', 'Lead criado com sucesso!')
        await fetchLeads() // This will also fetch match counts
        setShowForm(false)
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao criar lead')
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      showNotification('error', 'Erro ao criar lead')
    }
  }

  const handleUpdateLead = async (leadData: any) => {
    try {
      const response = await fetch(`/api/leads/${editingLead?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      })

      if (response.ok) {
        showNotification('success', 'Lead atualizado com sucesso!')
        await fetchLeads() // This will also fetch match counts
        setEditingLead(null)
        setShowForm(false)
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao atualizar lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      showNotification('error', 'Erro ao atualizar lead')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja deletar este lead?')) return

    try {
      setDeletingLeadId(leadId)
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('success', 'Lead excluído com sucesso!')
        await fetchLeads() // This will also fetch match counts
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao excluir lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      showNotification('error', 'Erro ao excluir lead')
    } finally {
      setDeletingLeadId(null)
    }
  }

  const handleViewMatches = (lead: Lead) => {
    setSelectedLeadForMatches(lead)
    setShowMatchesModal(true)
  }

  const handleViewMatchesFromAlert = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) {
      handleViewMatches(lead)
      setNewMatches([]) // Dismiss the alert
    }
  }

  const handleDismissMatchAlert = () => {
    setNewMatches([])
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CONVERTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo'
      case 'CONVERTED': return 'Convertido'
      case 'INACTIVE': return 'Inativo'
      case 'ARCHIVED': return 'Arquivado'
      default: return status
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const getInterestLabel = (interest: string) => {
    return interest === 'RENT' ? 'Aluguel' : 'Compra'
  }

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'APARTMENT': return 'Apartamento'
      case 'HOUSE': return 'Casa'
      case 'COMMERCIAL': return 'Comercial'
      case 'LAND': return 'Terreno'
      case 'STUDIO': return 'Studio'
      default: return type
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const matchesInterest = filterInterest === 'all' || lead.interest === filterInterest

    return matchesSearch && matchesStatus && matchesInterest
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerencie seus leads e encontre matches automáticos
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => {
                  setEditingLead(null)
                  setShowForm(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leads.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leads.filter(l => l.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Convertidos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leads.filter(l => l.status === 'CONVERTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Com Matches</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Object.values(matchCounts).filter(count => count > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os Status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="CONVERTED">Convertido</option>
              <option value="INACTIVE">Inativo</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>

            <select
              value={filterInterest}
              onChange={(e) => setFilterInterest(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos os Interesses</option>
              <option value="RENT">Aluguel</option>
              <option value="BUY">Compra</option>
            </select>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum lead encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterStatus !== 'all' || filterInterest !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu primeiro lead.'}
              </p>
              {(!searchTerm && filterStatus === 'all' && filterInterest === 'all') && (
                <button
                  onClick={() => {
                    setEditingLead(null)
                    setShowForm(true)
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Lead
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Interesse
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Orçamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Matches
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLeads.map((lead) => {
                    const cities = JSON.parse(lead.preferredCities)
                    const states = JSON.parse(lead.preferredStates)
                    
                    return (
                      <tr 
                        key={lead.id} 
                        className={`transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm ${
                          deletingLeadId === lead.id ? 'opacity-60 bg-red-50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {lead.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getInterestLabel(lead.interest)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Home className="w-3 h-3 mr-1" />
                              {getPropertyTypeLabel(lead.propertyType)}
                            </div>
                            {(lead.minBedrooms || lead.maxBedrooms) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {lead.minBedrooms || 0}-{lead.maxBedrooms || '∞'} quartos
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {lead.minPrice ? formatCurrency(lead.minPrice) : 'Min: Não def.'} - {formatCurrency(lead.maxPrice)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {cities.length > 0 ? cities.slice(0, 2).join(', ') : 'Qualquer cidade'}
                            {cities.length > 2 && ` (+${cities.length - 2})`}
                          </div>
                          {states.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {states.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {matchCounts[lead.id] > 0 ? (
                              <>
                                <div className="flex items-center text-green-600 dark:text-green-400">
                                  <div className="relative">
                                    <Bell className="w-4 h-4 mr-1" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  </div>
                                  <span className="text-sm font-medium">{matchCounts[lead.id]}</span>
                                </div>
                                <button
                                  onClick={() => handleViewMatches(lead)}
                                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Ver Matches
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleViewMatches(lead)}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Buscar
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingLead(lead)
                                setShowForm(true)
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                              title="Editar lead"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              disabled={deletingLeadId === lead.id}
                              className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 ${
                                deletingLeadId === lead.id ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
                              }`}
                              title="Excluir lead"
                            >
                              {deletingLeadId === lead.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lead Form Modal */}
      {showForm && (
        <LeadForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingLead(null)
          }}
          onSubmit={editingLead ? handleUpdateLead : handleCreateLead}
          lead={editingLead}
        />
      )}

      {/* Lead Matches Modal */}
      {showMatchesModal && selectedLeadForMatches && (
        <LeadMatchesModal
          isOpen={showMatchesModal}
          onClose={() => {
            setShowMatchesModal(false)
            setSelectedLeadForMatches(null)
          }}
          leadId={selectedLeadForMatches.id}
          leadName={selectedLeadForMatches.name}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-out animate-in slide-in-from-right ${
            notification.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-5000 ease-linear"
              style={{ 
                width: '100%',
                animation: 'shrink 5s linear forwards'
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
        .slide-in-from-right {
          animation: animate-in 0.3s ease-out;
        }
      `}</style>

      {/* Match Alert */}
      <MatchAlert
        matches={newMatches}
        onDismiss={handleDismissMatchAlert}
        onViewMatches={handleViewMatchesFromAlert}
      />
    </DashboardLayout>
  )
}
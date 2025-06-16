'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { PropertyForm } from '@/components/property-form'
import { Plus, Search, MapPin, Bed, Bath, Square, Edit, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react'

interface Property {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  bedrooms: number
  bathrooms: number
  area: number
  rentPrice: number
  salePrice: number | null
  propertyType: string
  status: string
  images: string[]
  amenities: string[]
  owner: {
    id: string
    name: string
    email: string
  }
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (response.ok) {
        const data = await response.json()
        setProperties(data)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProperty = async (data: any) => {
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images: JSON.stringify(data.images),
          amenities: JSON.stringify(data.amenities)
        }),
      })

      if (response.ok) {
        await fetchProperties()
        setShowForm(false)
        showNotification('success', 'Imóvel cadastrado com sucesso!')
        
        // Dispatch custom event to notify other components about property creation
        window.dispatchEvent(new CustomEvent('propertyCreated'))
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao criar imóvel')
      }
    } catch (error) {
      console.error('Error creating property:', error)
      showNotification('error', 'Erro ao criar imóvel')
    }
  }

  const handleEditProperty = async (data: any) => {
    if (!editingProperty) return

    try {
      const response = await fetch(`/api/properties/${editingProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          images: JSON.stringify(data.images),
          amenities: JSON.stringify(data.amenities)
        }),
      })

      if (response.ok) {
        await fetchProperties()
        setShowForm(false)
        setEditingProperty(null)
        showNotification('success', 'Imóvel atualizado com sucesso!')
        
        // Dispatch custom event to notify other components about property update
        window.dispatchEvent(new CustomEvent('propertyUpdated'))
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao atualizar imóvel')
      }
    } catch (error) {
      console.error('Error updating property:', error)
      showNotification('error', 'Erro ao atualizar imóvel')
    }
  }

  const handleDirectDeleteProperty = async (propertyId: string) => {
    if (!confirm('Tem certeza que deseja deletar este imóvel?')) return

    try {
      setDeletingPropertyId(propertyId)
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('success', 'Imóvel excluído com sucesso!')
        await fetchProperties()
        
        // Dispatch custom event to notify other components about property deletion
        window.dispatchEvent(new CustomEvent('propertyUpdated'))
      } else {
        const errorData = await response.json()
        showNotification('error', errorData.error || 'Erro ao excluir imóvel')
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      showNotification('error', 'Erro ao excluir imóvel')
    } finally {
      setDeletingPropertyId(null)
    }
  }


  const openEditForm = (property: Property) => {
    setEditingProperty(property)
    setShowForm(true)
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || property.status === filterStatus
    const matchesType = filterType === 'all' || property.propertyType === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'RENTED':
        return 'bg-blue-100 text-blue-800'
      case 'SOLD':
        return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Disponível'
      case 'RENTED':
        return 'Alugado'
      case 'SOLD':
        return 'Vendido'
      case 'MAINTENANCE':
        return 'Manutenção'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Apartamento'
      case 'HOUSE':
        return 'Casa'
      case 'COMMERCIAL':
        return 'Comercial'
      case 'LAND':
        return 'Terreno'
      case 'STUDIO':
        return 'Studio'
      default:
        return type
    }
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Imóveis</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os imóveis do seu portfólio
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Imóvel
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar imóveis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="AVAILABLE">Disponível</option>
                <option value="RENTED">Alugado</option>
                <option value="SOLD">Vendido</option>
                <option value="MAINTENANCE">Manutenção</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="APARTMENT">Apartamento</option>
                <option value="HOUSE">Casa</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="LAND">Terreno</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProperties.map((property) => (
            <div 
              key={property.id} 
              className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 transform ${
                deletingPropertyId === property.id 
                  ? 'opacity-60 bg-red-50 scale-95' 
                  : 'hover:shadow-md hover:scale-[1.02]'
              }`}
            >
              <div className="h-32 bg-gray-200 relative">
                {property.images.length > 0 ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Sem imagem
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                    {getStatusText(property.status)}
                  </span>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {property.title}
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                    {getTypeText(property.propertyType)}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-1">
                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="text-xs line-clamp-1">{property.address}, {property.city}</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-3 h-3 mr-0.5" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-3 h-3 mr-0.5" />
                    <span>{property.bathrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-3 h-3 mr-0.5" />
                    <span>{property.area}m²</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      R$ {property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
                    </p>
                    <p className="text-xs text-gray-500">
                      {property.owner.name}
                    </p>
                  </div>
                  <div className="flex space-x-0.5">
                    <button 
                      onClick={() => openEditForm(property)}
                      className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-all duration-200 transform hover:scale-110"
                      title="Editar imóvel"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDirectDeleteProperty(property.id)}
                      disabled={deletingPropertyId === property.id}
                      className={`p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-all duration-200 transform hover:scale-110 ${
                        deletingPropertyId === property.id ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
                      }`}
                      title="Deletar imóvel"
                    >
                      {deletingPropertyId === property.id ? (
                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum imóvel encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando um novo imóvel ao sistema.'}
            </p>
          </div>
        )}

        {/* Property Form Modal */}
        <PropertyForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingProperty ? handleEditProperty : handleCreateProperty}
          property={editingProperty}
        />


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
      </div>
    </DashboardLayout>
  )
}
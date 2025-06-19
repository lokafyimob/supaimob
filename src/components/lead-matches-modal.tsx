'use client'

import { useState, useEffect } from 'react'
import { X, Eye, MapPin, Home, Users, Square, Bath, Star } from 'lucide-react'

interface LeadMatchesModalProps {
  isOpen: boolean
  onClose: () => void
  leadId: string
  leadName: string
}

interface MatchedProperty {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  area: number
  rentPrice: number
  salePrice: number | null
  propertyType: string
  images: string[]
  amenities: string[]
  matchScore: number
  owner: {
    id: string
    name: string
    phone: string
    email: string
  }
}

export function LeadMatchesModal({ isOpen, onClose, leadId, leadName }: LeadMatchesModalProps) {
  const [matches, setMatches] = useState<MatchedProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<MatchedProperty | null>(null)

  useEffect(() => {
    if (isOpen && leadId) {
      fetchMatches()
    }
  }, [isOpen, leadId])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/matches`)
      if (response.ok) {
        const data = await response.json()
        setMatches(data)
      } else {
        console.error('Error fetching matches')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Matches para {leadName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {matches.length} {matches.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum match encontrado
              </h3>
              <p className="text-gray-600">
                Não há imóveis disponíveis que atendam aos critérios deste lead.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {matches.map((property) => (
                <div
                  key={property.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Match Score Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(property.matchScore)}`}>
                      <Star className="w-3 h-3 inline mr-1" />
                      {property.matchScore}% match
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {property.title}
                      </h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getPropertyTypeLabel(property.propertyType)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">{property.address}, {property.city} - {property.state}</span>
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        {property.bedrooms} quartos
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Bath className="w-4 h-4 mr-1" />
                        {property.bathrooms} banheiros
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Square className="w-4 h-4 mr-1" />
                        {property.area}m²
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      {property.rentPrice > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Aluguel:</span> {formatCurrency(property.rentPrice)}
                        </div>
                      )}
                      {property.salePrice && property.salePrice > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Venda:</span> {formatCurrency(property.salePrice)}
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    {(() => {
                      const amenitiesArray = Array.isArray(property.amenities) 
                        ? property.amenities 
                        : (typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : [])
                      
                      return amenitiesArray && amenitiesArray.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {amenitiesArray.slice(0, 3).map((amenity: string, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {amenity}
                              </span>
                            ))}
                            {amenitiesArray.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{amenitiesArray.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Owner Info */}
                    <div className="border-t border-gray-100 pt-3 mb-3">
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">{property.owner.name}</div>
                        <div>{property.owner.phone}</div>
                        <div>{property.owner.email}</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setSelectedProperty(property)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {matches.length > 0 && (
                <>
                  Mostrando {matches.length} imóveis compatíveis •{' '}
                  <span className="text-green-600 font-medium">
                    {matches.filter(p => p.matchScore >= 80).length} matches perfeitos
                  </span>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}

// Property Detail Modal Component
interface PropertyDetailModalProps {
  property: MatchedProperty
  onClose: () => void
}

function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{property.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Images */}
          {property.images && property.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {property.images.map((image, index) => (
                <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${property.title} - Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalhes do Imóvel</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Endereço:</span>
                  <span className="font-medium">{property.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cidade:</span>
                  <span className="font-medium">{property.city} - {property.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quartos:</span>
                  <span className="font-medium">{property.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Banheiros:</span>
                  <span className="font-medium">{property.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Área:</span>
                  <span className="font-medium">{property.area}m²</span>
                </div>
                {property.rentPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aluguel:</span>
                    <span className="font-medium text-green-600">{formatCurrency(property.rentPrice)}</span>
                  </div>
                )}
                {property.salePrice && property.salePrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venda:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(property.salePrice)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Contato do Proprietário</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nome:</span>
                  <span className="font-medium">{property.owner.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-medium">{property.owner.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{property.owner.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {(() => {
            const amenitiesArray = Array.isArray(property.amenities) 
              ? property.amenities 
              : (typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : [])
            
            return amenitiesArray && amenitiesArray.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Comodidades</h4>
                <div className="flex flex-wrap gap-2">
                  {amenitiesArray.map((amenity: string, index: number) => (
                    <span
                      key={index}
                      className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => window.open(`tel:${property.owner.phone}`, '_self')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ligar para Proprietário
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
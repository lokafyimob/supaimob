'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  ExternalLink,
  MapPin,
  Bed,
  Bath,
  Square,
  DollarSign,
  Calendar,
  Star,
  Search,
  Loader2,
  Globe,
  AlertCircle,
  TrendingUp,
  Navigation
} from 'lucide-react'

interface ListingResult {
  title: string
  price: number
  location: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  bedrooms?: number
  bathrooms?: number
  area?: number
  description: string
  url: string
  images: string[]
  source: string
  postedDate?: string
  relevanceScore: number
}

interface AIListingsModalProps {
  isOpen: boolean
  onClose: () => void
  leadId: string
  leadName: string
}

export function AIListingsModal({ isOpen, onClose, leadId, leadName }: AIListingsModalProps) {
  const [listings, setListings] = useState<ListingResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadInfo, setLeadInfo] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    if (isOpen && leadId) {
      fetchListings()
    }
  }, [isOpen, leadId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔍 Buscando anúncios para lead ${leadId}...`)
      
      const response = await fetch(`/api/leads/${leadId}/listings`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar anúncios')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setListings(data.listings || [])
        setLeadInfo(data.lead)
        console.log(`✅ ${data.listings?.length || 0} anúncios encontrados`)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'VivaReal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'ZAP Imóveis': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'OLX': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'ImovelWeb': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getRelevanceStars = (score: number) => {
    const stars = Math.round(score * 5)
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < stars ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Anúncios Inteligentes para {leadName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Encontrados automaticamente usando IA
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Buscando anúncios...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                Estamos usando IA para encontrar os melhores anúncios na internet que combinam com o perfil do seu lead.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Erro ao buscar anúncios
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                {error}
              </p>
              <button
                onClick={fetchListings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum anúncio encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Não encontramos anúncios que atendam aos critérios deste lead.
              </p>
              <button
                onClick={fetchListings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buscar Novamente
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lead Info */}
              {leadInfo && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Critérios de Busca
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Interesse:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {leadInfo.interest === 'RENT' ? 'Aluguel' : 'Compra'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {leadInfo.propertyType}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Orçamento:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Até {formatCurrency(leadInfo.maxPrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Localização:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {leadInfo.preferredCities.length > 0 
                          ? leadInfo.preferredCities.slice(0, 2).join(', ') 
                          : leadInfo.preferredStates.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing, index) => (
                  <div 
                    key={index}
                    className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div className="h-48 bg-gray-200 dark:bg-gray-600 relative">
                      {listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Globe className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Source badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(listing.source)}`}>
                          {listing.source}
                        </span>
                      </div>
                      
                      {/* Relevance score */}
                      <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 flex items-center space-x-1">
                        <div className="flex items-center">
                          {getRelevanceStars(listing.relevanceScore)}
                        </div>
                        <span className={`text-xs font-medium ${getRelevanceColor(listing.relevanceScore)}`}>
                          {Math.round(listing.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      
                      <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="font-bold text-lg">
                          {formatCurrency(listing.price)}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{listing.location}</span>
                      </div>

                      {/* GPS Coordinates */}
                      {listing.coordinates && (
                        <div className="flex items-center text-blue-600 dark:text-blue-400 mb-3">
                          <Navigation className="w-3 h-3 mr-1" />
                          <span className="text-xs font-mono">
                            GPS: {listing.coordinates.latitude.toFixed(4)}, {listing.coordinates.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {/* Property details */}
                      <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        {listing.bedrooms && (
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            <span>{listing.bedrooms}</span>
                          </div>
                        )}
                        {listing.bathrooms && (
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            <span>{listing.bathrooms}</span>
                          </div>
                        )}
                        {listing.area && (
                          <div className="flex items-center">
                            <Square className="w-4 h-4 mr-1" />
                            <span>{listing.area}m²</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {listing.postedDate && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(listing.postedDate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                        
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Anúncio
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
                <p>
                  🤖 Resultados encontrados usando inteligência artificial • 
                  {listings.length} anúncios selecionados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Users, MapPin, Filter, Eye } from 'lucide-react'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  interest: string
  propertyType: string
  maxPrice: number
  preferredLocation?: string
  locationRadius?: number
  status: string
  createdAt: string
}

interface LocationData {
  lat: number
  lng: number
  address: string
  radius: number
}

export default function LeadsMapPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filters, setFilters] = useState({
    interest: '',
    propertyType: '',
    status: '',
    priceRange: ''
  })
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (leads.length > 0 && mapRef.current && window.google) {
      initializeMap()
    }
  }, [leads])

  useEffect(() => {
    applyFilters()
  }, [filters, leads])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    // Center map on Brazil
    const center = { lat: -14.2350, lng: -51.9253 }

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    // Create info window
    infoWindowRef.current = new window.google.maps.InfoWindow()

    updateMapMarkers(filteredLeads)
  }

  const updateMapMarkers = (leadsToShow: Lead[]) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers for leads with location
    leadsToShow.forEach(lead => {
      if (lead.preferredLocation) {
        try {
          const location: LocationData = JSON.parse(lead.preferredLocation)
          
          // Create marker
          const marker = new window.google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: mapInstance.current,
            title: lead.name,
            icon: {
              url: getMarkerIcon(lead.interest, lead.status),
              scaledSize: new window.google.maps.Size(32, 32),
            }
          })

          // Create circle for radius
          const circle = new window.google.maps.Circle({
            strokeColor: getCircleColor(lead.interest),
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: getCircleColor(lead.interest),
            fillOpacity: 0.15,
            map: mapInstance.current,
            center: { lat: location.lat, lng: location.lng },
            radius: (lead.locationRadius || 5) * 1000, // Convert to meters
          })

          // Add click listener
          marker.addListener('click', () => {
            setSelectedLead(lead)
            infoWindowRef.current.setContent(createInfoWindowContent(lead, location))
            infoWindowRef.current.open(mapInstance.current, marker)
          })

          markersRef.current.push(marker, circle)
        } catch (error) {
          console.error('Error parsing location for lead:', lead.id, error)
        }
      }
    })
  }

  const getMarkerIcon = (interest: string, status: string) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/'
    
    if (status === 'CONVERTED') return `${baseUrl}green-dot.png`
    if (status === 'INACTIVE') return `${baseUrl}grey-dot.png`
    
    return interest === 'RENT' ? `${baseUrl}blue-dot.png` : `${baseUrl}red-dot.png`
  }

  const getCircleColor = (interest: string) => {
    return interest === 'RENT' ? '#3b82f6' : '#ef4444'
  }

  const createInfoWindowContent = (lead: Lead, location: LocationData) => {
    return `
      <div class="p-3 max-w-xs">
        <h3 class="font-bold text-lg mb-2">${lead.name}</h3>
        <div class="space-y-1 text-sm">
          <p><strong>Interesse:</strong> ${lead.interest === 'RENT' ? 'Aluguel' : 'Compra'}</p>
          <p><strong>Tipo:</strong> ${getPropertyTypeLabel(lead.propertyType)}</p>
          <p><strong>Orçamento:</strong> R$ ${lead.maxPrice?.toLocaleString('pt-BR') || 'N/A'}</p>
          <p><strong>Status:</strong> ${getStatusLabel(lead.status)}</p>
          <p><strong>Localização:</strong> ${location.address}</p>
          <p><strong>Raio:</strong> ${lead.locationRadius || 5}km</p>
          <p><strong>Telefone:</strong> ${lead.phone}</p>
        </div>
        <button 
          onclick="window.viewLeadDetails('${lead.id}')"
          class="mt-3 w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Ver Detalhes
        </button>
      </div>
    `
  }

  const getPropertyTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'APARTMENT': 'Apartamento',
      'HOUSE': 'Casa',
      'COMMERCIAL': 'Comercial',
      'LAND': 'Terreno',
      'STUDIO': 'Studio'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'ACTIVE': 'Ativo',
      'CONVERTED': 'Convertido',
      'INACTIVE': 'Inativo',
      'ARCHIVED': 'Arquivado'
    }
    return labels[status] || status
  }

  const applyFilters = () => {
    let filtered = leads

    if (filters.interest) {
      filtered = filtered.filter(lead => lead.interest === filters.interest)
    }

    if (filters.propertyType) {
      filtered = filtered.filter(lead => lead.propertyType === filters.propertyType)
    }

    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status)
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      filtered = filtered.filter(lead => {
        if (!lead.maxPrice) return false
        return lead.maxPrice >= min && (max ? lead.maxPrice <= max : true)
      })
    }

    setFilteredLeads(filtered)
    
    if (mapInstance.current) {
      updateMapMarkers(filtered)
    }
  }

  const getTotalWithLocation = () => {
    return filteredLeads.filter(lead => lead.preferredLocation).length
  }

  // Global function for info window button
  useEffect(() => {
    (window as any).viewLeadDetails = (leadId: string) => {
      window.open(`/leads?leadId=${leadId}`, '_blank')
    }
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/leads"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mapa de Leads</h1>
                <p className="text-sm text-gray-500">
                  {getTotalWithLocation()} de {filteredLeads.length} leads com localização
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Aluguel</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Compra</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Convertido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={filters.interest}
              onChange={(e) => setFilters(prev => ({ ...prev, interest: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">Todos os interesses</option>
              <option value="RENT">Aluguel</option>
              <option value="BUY">Compra</option>
            </select>

            <select
              value={filters.propertyType}
              onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">Todos os tipos</option>
              <option value="APARTMENT">Apartamento</option>
              <option value="HOUSE">Casa</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="LAND">Terreno</option>
              <option value="STUDIO">Studio</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="CONVERTED">Convertido</option>
              <option value="INACTIVE">Inativo</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="">Todas as faixas de preço</option>
              <option value="0-100000">Até R$ 100 mil</option>
              <option value="100000-300000">R$ 100 mil - R$ 300 mil</option>
              <option value="300000-500000">R$ 300 mil - R$ 500 mil</option>
              <option value="500000-1000000">R$ 500 mil - R$ 1 milhão</option>
              <option value="1000000-">Acima de R$ 1 milhão</option>
            </select>

            <button
              onClick={() => setFilters({ interest: '', propertyType: '', status: '', priceRange: '' })}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <div
          ref={mapRef}
          className="w-full h-[calc(100vh-200px)]"
          style={{ minHeight: '600px' }}
        />
      </div>

      {/* Stats */}
      <div className="bg-white border-t">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{filteredLeads.length} leads filtrados</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{getTotalWithLocation()} com localização</span>
              </div>
            </div>
            
            <div>
              {getTotalWithLocation() === 0 && (
                <span className="text-orange-600">
                  Nenhum lead com localização encontrado
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
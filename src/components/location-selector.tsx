'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, X } from 'lucide-react'

interface LocationData {
  lat: number
  lng: number
  address: string
  radius: number
}

interface LocationSelectorProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
}

export function LocationSelector({ value, onChange, placeholder = "Buscar localização...", className = "" }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [radius, setRadius] = useState(value?.radius || 5)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)

  // Initialize Google Maps
  useEffect(() => {
    if (isOpen && mapRef.current && window.google) {
      initializeMap()
    }
  }, [isOpen])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const center = value ? { lat: value.lat, lng: value.lng } : { lat: -23.5505, lng: -46.6333 } // São Paulo default

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    // Add click listener
    mapInstance.current.addListener('click', (e: any) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      updateLocation(lat, lng)
    })

    // Add existing marker if value exists
    if (value) {
      updateMarker(value.lat, value.lng)
      updateCircle(value.lat, value.lng, radius)
    }
  }

  const updateLocation = async (lat: number, lng: number) => {
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ location: { lat, lng } })
      
      if (result.results && result.results[0]) {
        const address = result.results[0].formatted_address
        const locationData: LocationData = { lat, lng, address, radius }
        
        onChange(locationData)
        updateMarker(lat, lng)
        updateCircle(lat, lng, radius)
        setSearchQuery(address)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  const updateMarker = (lat: number, lng: number) => {
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      title: 'Localização preferida',
    })
  }

  const updateCircle = (lat: number, lng: number, radiusKm: number) => {
    if (circleRef.current) {
      circleRef.current.setMap(null)
    }

    circleRef.current = new window.google.maps.Circle({
      strokeColor: '#ff4352',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#ff4352',
      fillOpacity: 0.15,
      map: mapInstance.current,
      center: { lat, lng },
      radius: radiusKm * 1000, // Convert to meters
    })
  }

  const searchLocation = async (query: string) => {
    if (!query || !window.google) return

    setIsLoading(true)
    try {
      const service = new window.google.maps.places.AutocompleteService()
      const request = {
        input: query,
        componentRestrictions: { country: 'br' },
        types: ['geocode'],
      }

      service.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 5))
        } else {
          setSuggestions([])
        }
        setIsLoading(false)
      })
    } catch (error) {
      console.error('Search error:', error)
      setIsLoading(false)
    }
  }

  const selectSuggestion = async (placeId: string, description: string) => {
    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await geocoder.geocode({ placeId })
      
      if (result.results && result.results[0]) {
        const location = result.results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()
        
        const locationData: LocationData = { lat, lng, address: description, radius }
        onChange(locationData)
        
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat, lng })
          updateMarker(lat, lng)
          updateCircle(lat, lng, radius)
        }
        
        setSearchQuery(description)
        setSuggestions([])
      }
    } catch (error) {
      console.error('Place selection error:', error)
    }
  }

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius)
    if (value) {
      const updatedLocation = { ...value, radius: newRadius }
      onChange(updatedLocation)
      updateCircle(value.lat, value.lng, newRadius)
    }
  }

  const clearLocation = () => {
    onChange(null)
    setSearchQuery('')
    setSuggestions([])
    if (markerRef.current) markerRef.current.setMap(null)
    if (circleRef.current) circleRef.current.setMap(null)
  }

  // Load Google Maps script
  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className={value ? "text-gray-900" : "text-gray-500"}>
              {value ? value.address : placeholder}
            </span>
          </div>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearLocation()
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </button>

      {value && (
        <div className="mt-2 text-sm text-gray-600">
          Raio de busca: {radius}km
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Selecionar Localização Preferida</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchLocation(e.target.value)
                  }}
                  placeholder="Digite um endereço ou local..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => selectSuggestion(suggestion.place_id, suggestion.description)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                      <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Radius Selector */}
              <div className="mt-3 flex items-center space-x-4">
                <label className="text-sm font-medium">Raio de busca:</label>
                <select
                  value={radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value={1}>1 km</option>
                  <option value={3}>3 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={15}>15 km</option>
                  <option value={20}>20 km</option>
                </select>
              </div>
            </div>

            {/* Map */}
            <div className="flex-1 p-4">
              <div
                ref={mapRef}
                className="w-full h-full rounded-lg border"
                style={{ minHeight: '300px' }}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
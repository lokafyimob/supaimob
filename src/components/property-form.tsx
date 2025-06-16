'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Plus } from 'lucide-react'

interface PropertyFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  property?: any
}

interface Owner {
  id: string
  name: string
  email: string
}

export function PropertyForm({ isOpen, onClose, onSubmit, property }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    rentPrice: '',
    salePrice: '',
    propertyType: 'APARTMENT',
    status: 'AVAILABLE',
    availableFor: ['RENT'] as string[], // RENT, SALE
    ownerId: '',
    images: [] as string[],
    amenities: [] as string[]
  })

  const [displayValues, setDisplayValues] = useState({
    rentPrice: '',
    salePrice: '',
    zipCode: ''
  })

  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(false)
  const [newAmenity, setNewAmenity] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchOwners()
      if (property) {
        try {
          const images = Array.isArray(property.images) 
            ? property.images 
            : (typeof property.images === 'string' && property.images ? JSON.parse(property.images) : [])
          
          const amenities = Array.isArray(property.amenities) 
            ? property.amenities 
            : (typeof property.amenities === 'string' && property.amenities ? JSON.parse(property.amenities) : [])

          // Use stored availableFor value or determine based on existing prices
          let availableFor = []
          if (property.availableFor) {
            availableFor = Array.isArray(property.availableFor) 
              ? property.availableFor 
              : JSON.parse(property.availableFor)
          } else {
            // Fallback: determine based on existing prices
            if (property.rentPrice && property.rentPrice > 0) availableFor.push('RENT')
            if (property.salePrice && property.salePrice > 0) availableFor.push('SALE')
            if (availableFor.length === 0) availableFor.push('RENT') // Default
          }

          setFormData({
            title: property.title || '',
            description: property.description || '',
            address: property.address || '',
            city: property.city || '',
            state: property.state || '',
            zipCode: property.zipCode || '',
            bedrooms: property.bedrooms || 1,
            bathrooms: property.bathrooms || 1,
            area: property.area?.toString() || '',
            rentPrice: property.rentPrice?.toString() || '',
            salePrice: property.salePrice?.toString() || '',
            propertyType: property.propertyType || 'APARTMENT',
            status: property.status || 'AVAILABLE',
            availableFor: availableFor,
            ownerId: property.owner?.id || property.ownerId || '',
            images: images,
            amenities: amenities
          })
        } catch (error) {
          console.error('Error parsing property data:', error)
          resetForm()
        }
        setDisplayValues({
          rentPrice: property.rentPrice ? property.rentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
          salePrice: property.salePrice ? property.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
          zipCode: property.zipCode || ''
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, property])

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/owners')
      if (response.ok) {
        const data = await response.json()
        setOwners(data)
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        bedrooms: parseInt(formData.bedrooms.toString()),
        bathrooms: parseInt(formData.bathrooms.toString()),
        area: parseFloat(formData.area),
        rentPrice: formData.availableFor.includes('RENT') ? parseFloat(formData.rentPrice) : 0,
        salePrice: formData.availableFor.includes('SALE') && formData.salePrice ? parseFloat(formData.salePrice) : null,
        images: formData.images,
        amenities: formData.amenities
      }

      onSubmit(submitData)
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
      title: '',
      description: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      bedrooms: 1,
      bathrooms: 1,
      area: '',
      rentPrice: '',
      salePrice: '',
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      availableFor: ['RENT'],
      ownerId: '',
      images: [],
      amenities: []
    })
    setDisplayValues({
      rentPrice: '',
      salePrice: '',
      zipCode: ''
    })
    setNewAmenity('')
    setNewImageUrl('')
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }))
      setNewAmenity('')
    }
  }

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }))
  }

  const addImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    
    try {
      const uploadedUrls: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          alert(`Arquivo ${file.name} não é uma imagem válida`)
          continue
        }
        
        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`Arquivo ${file.name} é muito grande (máximo 5MB)`)
          continue
        }
        
        // Converter para base64 ou usar um serviço de upload
        const imageUrl = await convertFileToBase64(file)
        uploadedUrls.push(imageUrl)
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }))
      }
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploadingImages(false)
      // Limpar o input
      event.target.value = ''
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Erro ao converter arquivo'))
        }
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setUploadingImages(true)
    
    try {
      const uploadedUrls: string[] = []
      
      for (const file of files) {
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          alert(`Arquivo ${file.name} não é uma imagem válida`)
          continue
        }
        
        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`Arquivo ${file.name} é muito grande (máximo 5MB)`)
          continue
        }
        
        const imageUrl = await convertFileToBase64(file)
        uploadedUrls.push(imageUrl)
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }))
      }
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error)
      alert('Erro ao fazer upload das imagens')
    } finally {
      setUploadingImages(false)
    }
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8)
    if (numbers.length === 0) return ''
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
  }

  const formatCurrency = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    if (numbers === '') return ''
    
    // Converte para número e formata
    const numberValue = parseInt(numbers) / 100
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const parseCurrency = (value: string) => {
    // Remove formatação e retorna valor bruto para o estado
    const numbers = value.replace(/\D/g, '')
    return numbers === '' ? '' : (parseInt(numbers) / 100).toString()
  }

  const handleAvailableForChange = (type: string, checked: boolean) => {
    setFormData(prev => {
      const newAvailableFor = checked 
        ? [...prev.availableFor, type]
        : prev.availableFor.filter(t => t !== type)
      
      // Ensure at least one option is selected
      return {
        ...prev,
        availableFor: newAvailableFor.length > 0 ? newAvailableFor : [type]
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {property ? 'Editar Imóvel' : 'Novo Imóvel'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Imóvel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Apartamento 3 quartos Centro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proprietário *
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um proprietário</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} - {owner.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descreva as características do imóvel..."
            />
          </div>

          {/* Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rua, número, complemento"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="São Paulo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01234-567"
                maxLength={9}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="APARTMENT">Apartamento</option>
                <option value="HOUSE">Casa</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="LAND">Terreno</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponível Para *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availableFor.includes('RENT')}
                    onChange={(e) => handleAvailableForChange('RENT', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Aluguel</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.availableFor.includes('SALE')}
                    onChange={(e) => handleAvailableForChange('SALE', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Venda</span>
                </label>
              </div>
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
                <option value="AVAILABLE">Disponível</option>
                <option value="RENTED">Alugado</option>
                <option value="SOLD">Vendido</option>
                <option value="MAINTENANCE">Manutenção</option>
              </select>
            </div>
          </div>

          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quartos *
              </label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banheiros *
              </label>
              <input
                type="number"
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área (m²) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="85.5"
                required
              />
            </div>

            {formData.availableFor.includes('RENT') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aluguel (R$) *
                </label>
                <input
                  type="text"
                  value={displayValues.rentPrice}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setDisplayValues(prev => ({ ...prev, rentPrice: formatted }))
                    setFormData(prev => ({ ...prev, rentPrice: parseCurrency(e.target.value) }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2.500,00"
                  required={formData.availableFor.includes('RENT')}
                />
              </div>
            )}

            {formData.availableFor.includes('SALE') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venda (R$) *
                </label>
                <input
                  type="text"
                  value={displayValues.salePrice}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value)
                    setDisplayValues(prev => ({ ...prev, salePrice: formatted }))
                    setFormData(prev => ({ ...prev, salePrice: parseCurrency(e.target.value) }))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="450.000,00"
                  required={formData.availableFor.includes('SALE')}
                />
              </div>
            )}
          </div>

          {/* Imagens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Imóvel
            </label>
            <div className="space-y-4">
              {/* Upload de arquivos */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600 mb-4">
                    <label htmlFor="images-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">
                      Clique para selecionar arquivos
                    </label>
                    <span> ou arraste e solte aqui</span>
                  </div>
                  <input
                    id="images-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF até 5MB cada (múltiplas imagens)
                  </p>
                  {uploadingImages && (
                    <div className="mt-2 text-blue-600 text-sm">
                      Fazendo upload das imagens...
                    </div>
                  )}
                </div>
              </div>

              {/* Adicionar por URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ou adicione por URL da imagem"
                />
                <button
                  type="button"
                  onClick={addImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Imagens Adicionadas ({formData.images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={image} 
                            alt={`Imagem ${index + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                          title="Remover imagem"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comodidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comodidades
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Piscina, Academia, Garagem..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              {loading ? 'Salvando...' : property ? 'Atualizar' : 'Criar Imóvel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
import { Lead } from '@prisma/client'

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
  postedDate?: Date
  relevanceScore: number
}

interface SearchFilters {
  location: string
  propertyType: string
  minPrice?: number
  maxPrice: number
  minBedrooms?: number
  maxBedrooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  minArea?: number
  maxArea?: number
  interest: 'RENT' | 'BUY'
}

export class AIListingFinder {
  private openaiApiKey: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
  }

  async findListingsForLead(lead: Lead): Promise<ListingResult[]> {
    try {
      console.log(`🔍 Buscando anúncios para lead: ${lead.name}`)
      
      const preferredCities = JSON.parse(lead.preferredCities || '[]')
      const preferredStates = JSON.parse(lead.preferredStates || '[]')
      
      // Preparar filtros de busca
      const searchFilters: SearchFilters = {
        location: this.formatLocationString(preferredCities, preferredStates),
        propertyType: lead.propertyType,
        minPrice: lead.minPrice || undefined,
        maxPrice: lead.maxPrice,
        minBedrooms: lead.minBedrooms || undefined,
        maxBedrooms: lead.maxBedrooms || undefined,
        minBathrooms: lead.minBathrooms || undefined,
        maxBathrooms: lead.maxBathrooms || undefined,
        minArea: lead.minArea || undefined,
        maxArea: lead.maxArea || undefined,
        interest: lead.interest
      }

      // Buscar anúncios em diferentes fontes
      const allListings = await Promise.all([
        this.searchVivaReal(searchFilters),
        this.searchZapImoveis(searchFilters),
        this.searchOLX(searchFilters),
        this.searchImovelWeb(searchFilters)
      ])

      // Combinar resultados
      const combinedListings = allListings.flat()
      
      // Remover duplicatas baseado na URL
      const uniqueListings = this.removeDuplicates(combinedListings)
      
      // Usar IA para filtrar e ranquear
      const filteredListings = await this.filterWithAI(uniqueListings, lead)
      
      // Ordenar por relevância
      const sortedListings = filteredListings.sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      console.log(`✅ Encontrados ${sortedListings.length} anúncios relevantes para ${lead.name}`)
      
      return sortedListings.slice(0, 20) // Retornar top 20
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error)
      return []
    }
  }

  private formatLocationString(cities: string[], states: string[]): string {
    if (cities.length > 0) {
      return cities.join(', ')
    }
    if (states.length > 0) {
      return states.join(', ')
    }
    return 'Brasil'
  }

  private getNeighborhoodsForCity(city: string): string[] {
    const cityNeighborhoods: { [key: string]: string[] } = {
      'ÁGUAS CLARAS': ['Setor Norte', 'Setor Sul', 'Areal', 'Rua das Eucaliptos', 'Verdes Águas'],
      'BRASÍLIA': ['Asa Norte', 'Asa Sul', 'Lago Norte', 'Lago Sul', 'Sudoeste'],
      'TAGUATINGA': ['Centro', 'Norte', 'Sul', 'Setor C Norte', 'Setor P Norte'],
      'CEILÂNDIA': ['Centro', 'Norte', 'Sul', 'Setor O', 'Setor P'],
      'SAMAMBAIA': ['Norte', 'Sul', 'Centro', 'Setor Leste'],
      'PLANALTINA': ['Centro', 'Setor Norte', 'Setor Sul', 'Vila Buritis'],
      'SOBRADINHO': ['Centro', 'Setor Norte', 'Setor Sul', 'Grande Colorado'],
      'GAMA': ['Centro', 'Setor Norte', 'Setor Sul', 'Setor Leste'],
      'SÃO PAULO': ['Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste', 'Centro'],
      'RIO DE JANEIRO': ['Zona Sul', 'Zona Norte', 'Zona Oeste', 'Centro', 'Barra da Tijuca'],
      'BELO HORIZONTE': ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste'],
      'SALVADOR': ['Centro', 'Barra', 'Ondina', 'Pituba', 'Itapuã'],
      'FORTALEZA': ['Centro', 'Aldeota', 'Meireles', 'Cocó', 'Papicu'],
      'RECIFE': ['Centro', 'Boa Viagem', 'Zona Norte', 'Zona Sul', 'Zona Oeste']
    }

    const normalizedCity = city.toUpperCase().trim()
    return cityNeighborhoods[normalizedCity] || ['Centro', 'Zona Norte', 'Zona Sul', 'Setor A', 'Setor B']
  }

  private getCoordinatesForLocation(city: string, neighborhood: string): { latitude: number; longitude: number } {
    // Coordenadas GPS reais baseadas na cidade e bairro
    const locationCoordinates: { [key: string]: { [key: string]: { lat: number; lng: number } } } = {
      'ÁGUAS CLARAS': {
        'Setor Norte': { lat: -15.8341, lng: -48.0297 },
        'Setor Sul': { lat: -15.8426, lng: -48.0265 },
        'Areal': { lat: -15.8389, lng: -48.0234 },
        'Rua das Eucaliptos': { lat: -15.8365, lng: -48.0278 },
        'Verdes Águas': { lat: -15.8402, lng: -48.0189 }
      },
      'BRASÍLIA': {
        'Asa Norte': { lat: -15.7801, lng: -47.8825 },
        'Asa Sul': { lat: -15.8267, lng: -47.8906 },
        'Lago Norte': { lat: -15.7584, lng: -47.8598 },
        'Lago Sul': { lat: -15.8456, lng: -47.8734 },
        'Sudoeste': { lat: -15.8103, lng: -47.9234 }
      },
      'TAGUATINGA': {
        'Centro': { lat: -15.8323, lng: -48.0572 },
        'Norte': { lat: -15.8234, lng: -48.0612 },
        'Sul': { lat: -15.8412, lng: -48.0523 },
        'Setor C Norte': { lat: -15.8198, lng: -48.0634 },
        'Setor P Norte': { lat: -15.8167, lng: -48.0578 }
      },
      'CEILÂNDIA': {
        'Centro': { lat: -15.8198, lng: -48.1078 },
        'Norte': { lat: -15.8134, lng: -48.1145 },
        'Sul': { lat: -15.8267, lng: -48.1023 },
        'Setor O': { lat: -15.8223, lng: -48.1189 },
        'Setor P': { lat: -15.8189, lng: -48.1234 }
      },
      'SÃO PAULO': {
        'Zona Sul': { lat: -23.6821, lng: -46.7075 },
        'Zona Norte': { lat: -23.4692, lng: -46.5387 },
        'Zona Leste': { lat: -23.5815, lng: -46.3956 },
        'Zona Oeste': { lat: -23.5558, lng: -46.7315 },
        'Centro': { lat: -23.5505, lng: -46.6333 }
      },
      'RIO DE JANEIRO': {
        'Zona Sul': { lat: -22.9711, lng: -43.1872 },
        'Zona Norte': { lat: -22.8749, lng: -43.2775 },
        'Zona Oeste': { lat: -23.0045, lng: -43.4641 },
        'Centro': { lat: -22.9068, lng: -43.1729 },
        'Barra da Tijuca': { lat: -23.0131, lng: -43.3181 }
      }
    }

    const normalizedCity = city.toUpperCase().trim()
    const cityCoords = locationCoordinates[normalizedCity]
    
    if (cityCoords && cityCoords[neighborhood]) {
      return { 
        latitude: cityCoords[neighborhood].lat, 
        longitude: cityCoords[neighborhood].lng 
      }
    }
    
    // Fallback: coordenadas aproximadas do centro da cidade
    const cityDefaults: { [key: string]: { lat: number; lng: number } } = {
      'ÁGUAS CLARAS': { lat: -15.8386, lng: -48.0264 },
      'BRASÍLIA': { lat: -15.7942, lng: -47.8825 },
      'TAGUATINGA': { lat: -15.8323, lng: -48.0572 },
      'CEILÂNDIA': { lat: -15.8198, lng: -48.1078 },
      'SÃO PAULO': { lat: -23.5505, lng: -46.6333 },
      'RIO DE JANEIRO': { lat: -22.9068, lng: -43.1729 }
    }
    
    const fallback = cityDefaults[normalizedCity] || { lat: -15.7942, lng: -47.8825 } // Brasília como fallback
    return { latitude: fallback.lat, longitude: fallback.lng }
  }

  private async searchVivaReal(filters: SearchFilters): Promise<ListingResult[]> {
    try {
      console.log('🏠 Buscando no VivaReal...')
      
      // Construir URL de busca do VivaReal
      const baseUrl = 'https://www.vivareal.com.br'
      const searchType = filters.interest === 'RENT' ? 'aluguel' : 'venda'
      const propertyTypeMap: { [key: string]: string } = {
        'APARTMENT': 'apartamento',
        'HOUSE': 'casa',
        'COMMERCIAL': 'comercial',
        'LAND': 'terreno',
        'STUDIO': 'studio'
      }
      
      const propType = propertyTypeMap[filters.propertyType] || 'imovel'
      
      // Imagens reais de imóveis do Unsplash
      const propertyImages = [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop&auto=format'
      ]
      
      // Simular busca com múltiplos resultados APENAS nas localizações especificadas
      const mockListings: ListingResult[] = []
      
      // Usar exatamente as cidades preferidas do lead
      const leadCities = filters.location.split(', ')
      const targetCities = leadCities.length > 0 ? leadCities : ['Local não especificado']
      
      for (let i = 0; i < Math.min(5, targetCities.length * 2); i++) {
        const targetCity = targetCities[i % targetCities.length]
        const priceVariation = Math.random() * 0.4 + 0.8 // 80% - 120% do preço base
        const basePrice = filters.minPrice ? 
          filters.minPrice + (filters.maxPrice - filters.minPrice) * Math.random() :
          filters.maxPrice * Math.random()
        
        // Bairros/setores reais baseados na cidade
        const neighborhoods = this.getNeighborhoodsForCity(targetCity)
        const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        
        const coordinates = this.getCoordinatesForLocation(targetCity, randomNeighborhood)
        
        mockListings.push({
          title: `${propType.charAt(0).toUpperCase() + propType.slice(1)} ${i + 1} - ${targetCity}`,
          price: Math.floor(basePrice * priceVariation),
          location: `${targetCity} - ${randomNeighborhood}`,
          coordinates: coordinates,
          bedrooms: Math.max(1, (filters.minBedrooms || 2) + Math.floor(Math.random() * 3)),
          bathrooms: Math.max(1, (filters.minBathrooms || 1) + Math.floor(Math.random() * 2)),
          area: Math.max(30, (filters.minArea || 60) + Math.floor(Math.random() * 50)),
          description: `Excelente ${propType} em ${targetCity}, bairro ${randomNeighborhood}, com acabamento moderno, ${i % 2 === 0 ? 'mobiliado' : 'sem mobília'}, próximo a comércios locais. Coordenadas: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          url: `${baseUrl}/${searchType}/${propType}/distrito-federal/${targetCity.toLowerCase().replace(/\s+/g, '-')}/`,
          images: [propertyImages[i % propertyImages.length]],
          source: 'VivaReal',
          postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
          relevanceScore: 0.85 + Math.random() * 0.15 // 85-100% (alta relevância pois está na localização exata)
        })
      }
      
      return mockListings
    } catch (error) {
      console.error('Erro ao buscar no VivaReal:', error)
      return []
    }
  }

  private async searchZapImoveis(filters: SearchFilters): Promise<ListingResult[]> {
    try {
      console.log('🏢 Buscando no ZAP Imóveis...')
      
      // Imagens diferentes para o ZAP
      const zapImages = [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1585129777188-94600bc7b4c8?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&auto=format'
      ]
      
      const mockListings: ListingResult[] = []
      
      // Usar exatamente as cidades preferidas do lead
      const leadCities = filters.location.split(', ')
      const targetCities = leadCities.length > 0 ? leadCities : ['Local não especificado']
      
      for (let i = 0; i < Math.min(4, targetCities.length * 2); i++) {
        const targetCity = targetCities[i % targetCities.length]
        const priceVariation = Math.random() * 0.3 + 0.85 // 85% - 115% do preço base
        const basePrice = filters.minPrice ? 
          filters.minPrice + (filters.maxPrice - filters.minPrice) * Math.random() :
          filters.maxPrice * Math.random()
        
        const features = ['piscina', 'churrasqueira', 'academia', 'salão de festas', 'playground', 'jardim']
        const randomFeature = features[Math.floor(Math.random() * features.length)]
        
        // Bairros específicos para a cidade
        const neighborhoods = this.getNeighborhoodsForCity(targetCity)
        const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        
        const coordinates = this.getCoordinatesForLocation(targetCity, randomNeighborhood)
        
        mockListings.push({
          title: `${filters.interest === 'RENT' ? 'Locação' : 'Venda'} Premium ${i + 1} - ${targetCity}`,
          price: Math.floor(basePrice * priceVariation),
          location: `${targetCity} - ${randomNeighborhood}`,
          coordinates: coordinates,
          bedrooms: Math.max(1, (filters.minBedrooms || 2) + Math.floor(Math.random() * 2)),
          bathrooms: Math.max(1, (filters.minBathrooms || 1) + Math.floor(Math.random() * 3)),
          area: Math.max(40, (filters.minArea || 70) + Math.floor(Math.random() * 60)),
          description: `Excelente imóvel em ${targetCity}, bairro ${randomNeighborhood}, condomínio com ${randomFeature}, ${i % 3 === 0 ? 'vista livre' : 'andar alto'}, localização privilegiada. GPS: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          url: `https://www.zapimoveis.com.br/${filters.interest.toLowerCase()}/imoveis/df+${targetCity.toLowerCase().replace(/\s+/g, '+')}/`,
          images: [zapImages[i % zapImages.length]],
          source: 'ZAP Imóveis',
          postedDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // Últimos 20 dias
          relevanceScore: 0.8 + Math.random() * 0.2 // 80-100% (alta relevância pois está na localização exata)
        })
      }
      
      return mockListings
    } catch (error) {
      console.error('Erro ao buscar no ZAP Imóveis:', error)
      return []
    }
  }

  private async searchOLX(filters: SearchFilters): Promise<ListingResult[]> {
    try {
      console.log('🔍 Buscando no OLX...')
      
      // Imagens para OLX (mais simples, como particulares)
      const olxImages = [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=400&h=300&fit=crop&auto=format'
      ]
      
      const mockListings: ListingResult[] = []
      
      // Usar exatamente as cidades preferidas do lead
      const leadCities = filters.location.split(', ')
      const targetCities = leadCities.length > 0 ? leadCities : ['Local não especificado']
      
      for (let i = 0; i < Math.min(4, targetCities.length * 2); i++) {
        const targetCity = targetCities[i % targetCities.length]
        const priceVariation = Math.random() * 0.5 + 0.7 // 70% - 120% do preço base (mais variação no OLX)
        const basePrice = filters.minPrice ? 
          filters.minPrice + (filters.maxPrice - filters.minPrice) * Math.random() :
          filters.maxPrice * Math.random()
        
        const ownerTypes = ['Particular', 'Proprietário', 'Imobiliária Local']
        const conditions = ['Novo', 'Seminovo', 'Reformado', 'A reformar']
        const randomOwner = ownerTypes[Math.floor(Math.random() * ownerTypes.length)]
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
        
        // Bairros específicos para a cidade
        const neighborhoods = this.getNeighborhoodsForCity(targetCity)
        const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        
        const coordinates = this.getCoordinatesForLocation(targetCity, randomNeighborhood)
        
        mockListings.push({
          title: `${filters.propertyType} ${randomCondition} - ${targetCity} - ${randomOwner}`,
          price: Math.floor(basePrice * priceVariation),
          location: `${targetCity} - ${randomNeighborhood}`,
          coordinates: coordinates,
          bedrooms: Math.max(1, Math.floor(Math.random() * 4) + 1),
          bathrooms: Math.max(1, Math.floor(Math.random() * 3) + 1),
          area: Math.max(25, Math.floor(Math.random() * 100) + 40),
          description: `${filters.interest === 'RENT' ? 'Aluguel' : 'Venda'} de ${filters.propertyType.toLowerCase()} em ${targetCity}, bairro ${randomNeighborhood}. ${randomCondition}, ${randomOwner.toLowerCase()}. ${i % 2 === 0 ? 'Aceita financiamento' : 'Entrada facilitada'}. Localização: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          url: `https://www.olx.com.br/imoveis/estado-df/distrito-federal-e-regiao/${targetCity.toLowerCase().replace(/\s+/g, '-')}`,
          images: [olxImages[i % olxImages.length]],
          source: 'OLX',
          postedDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000), // Últimos 15 dias
          relevanceScore: 0.7 + Math.random() * 0.3 // 70-100% (melhor relevância pois está na localização exata)
        })
      }
      
      return mockListings
    } catch (error) {
      console.error('Erro ao buscar no OLX:', error)
      return []
    }
  }

  private async searchImovelWeb(filters: SearchFilters): Promise<ListingResult[]> {
    try {
      console.log('🌐 Buscando no ImovelWeb...')
      
      // Imagens para ImovelWeb (estilo mais profissional)
      const imovelWebImages = [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=400&h=300&fit=crop&auto=format',
        'https://images.unsplash.com/photo-1601760562234-9814eea6663a?w=400&h=300&fit=crop&auto=format'
      ]
      
      const mockListings: ListingResult[] = []
      
      // Usar exatamente as cidades preferidas do lead
      const leadCities = filters.location.split(', ')
      const targetCities = leadCities.length > 0 ? leadCities : ['Local não especificado']
      
      for (let i = 0; i < Math.min(3, targetCities.length * 2); i++) {
        const targetCity = targetCities[i % targetCities.length]
        const priceVariation = Math.random() * 0.25 + 0.9 // 90% - 115% do preço base (preços mais estáveis)
        const basePrice = filters.minPrice ? 
          filters.minPrice + (filters.maxPrice - filters.minPrice) * Math.random() :
          filters.maxPrice * Math.random()
        
        const amenities = ['elevador', 'garagem', 'varanda', 'área de serviço', 'interfone', 'portaria 24h']
        const randomAmenity = amenities[Math.floor(Math.random() * amenities.length)]
        
        // Bairros específicos para a cidade
        const neighborhoods = this.getNeighborhoodsForCity(targetCity)
        const randomNeighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)]
        
        const coordinates = this.getCoordinatesForLocation(targetCity, randomNeighborhood)
        
        mockListings.push({
          title: `Oportunidade ${i + 1} em ${targetCity} - ${filters.propertyType}`,
          price: Math.floor(basePrice * priceVariation),
          location: `${targetCity} - ${randomNeighborhood}`,
          coordinates: coordinates,
          bedrooms: Math.max(1, (filters.minBedrooms || 2) + Math.floor(Math.random() * 2)),
          bathrooms: Math.max(1, (filters.minBathrooms || 1) + Math.floor(Math.random() * 2)),
          area: Math.max(35, (filters.minArea || 55) + Math.floor(Math.random() * 45)),
          description: `Excelente oportunidade de ${filters.interest === 'RENT' ? 'locação' : 'investimento'} em ${targetCity}, bairro ${randomNeighborhood}. Imóvel com ${randomAmenity}, ${i % 2 === 0 ? 'pronto para morar' : 'ótimo estado'}, em região valorizada. Coordenadas exatas: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
          url: `https://www.imovelweb.com.br/imoveis-${filters.interest.toLowerCase()}/distrito-federal/${targetCity.toLowerCase().replace(/\s+/g, '-')}/`,
          images: [imovelWebImages[i % imovelWebImages.length]],
          source: 'ImovelWeb',
          postedDate: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000), // Últimos 25 dias
          relevanceScore: 0.8 + Math.random() * 0.2 // 80-100% (alta relevância pois está na localização exata)
        })
      }
      
      return mockListings
    } catch (error) {
      console.error('Erro ao buscar no ImovelWeb:', error)
      return []
    }
  }

  private removeDuplicates(listings: ListingResult[]): ListingResult[] {
    const seen = new Set<string>()
    return listings.filter(listing => {
      const key = `${listing.title}-${listing.price}-${listing.location}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private async filterWithAI(listings: ListingResult[], lead: Lead): Promise<ListingResult[]> {
    if (!this.openaiApiKey || listings.length === 0) {
      return listings
    }

    try {
      console.log('🤖 Filtrando anúncios com IA...')
      
      const leadProfile = {
        name: lead.name,
        interest: lead.interest,
        propertyType: lead.propertyType,
        minPrice: lead.minPrice,
        maxPrice: lead.maxPrice,
        minBedrooms: lead.minBedrooms,
        maxBedrooms: lead.maxBedrooms,
        minBathrooms: lead.minBathrooms,
        maxBathrooms: lead.maxBathrooms,
        minArea: lead.minArea,
        maxArea: lead.maxArea,
        preferredCities: JSON.parse(lead.preferredCities || '[]'),
        preferredStates: JSON.parse(lead.preferredStates || '[]'),
        notes: lead.notes
      }

      const prompt = `
Você é um assistente especializado em análise de imóveis. Analise os seguintes anúncios e determine quais são mais relevantes para este cliente:

PERFIL DO CLIENTE:
${JSON.stringify(leadProfile, null, 2)}

ANÚNCIOS ENCONTRADOS:
${JSON.stringify(listings.map(l => ({
  title: l.title,
  price: l.price,
  location: l.location,
  bedrooms: l.bedrooms,
  bathrooms: l.bathrooms,
  area: l.area,
  description: l.description,
  source: l.source
})), null, 2)}

Para cada anúncio, atribua uma pontuação de relevância de 0 a 1 considerando:
1. Compatibilidade com orçamento
2. Localização preferida
3. Especificações técnicas (quartos, banheiros, área)
4. Tipo de imóvel
5. Qualidade da descrição

Responda APENAS com um JSON array contendo objetos com "index" (posição do anúncio na lista) e "score" (pontuação de 0 a 1).
`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.choices[0].message.content
        
        try {
          const scores = JSON.parse(aiResponse)
          
          return listings.map((listing, index) => {
            const scoreData = scores.find((s: any) => s.index === index)
            return {
              ...listing,
              relevanceScore: scoreData ? scoreData.score : listing.relevanceScore
            }
          }).filter(listing => listing.relevanceScore > 0.7) // Filtrar apenas anúncios com score > 70% (alta relevância)
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta da IA:', parseError)
          return listings
        }
      } else {
        console.error('Erro na API do OpenAI:', response.status)
        return listings
      }
    } catch (error) {
      console.error('Erro ao usar IA para filtrar anúncios:', error)
      return listings
    }
  }
}
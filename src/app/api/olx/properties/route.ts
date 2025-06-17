import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API para exportar propriedades para o OLX
 * GET /api/olx/properties - Lista propriedades em formato OLX
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // 'olx', 'vivareal', 'zapimoveis'
    const active = searchParams.get('active') !== 'false'

    console.log('📤 Exporting properties for OLX integration')

    // Buscar propriedades ativas e disponíveis
    const properties = await prisma.property.findMany({
      where: {
        isAvailable: active,
        ...(active && { availableFor: { in: ['RENT', 'SALE', 'BOTH'] } })
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 Found ${properties.length} properties`)

    // Converter para formato específico
    const formattedProperties = properties.map(property => {
      if (format === 'olx') {
        return formatForOLX(property)
      } else if (format === 'vivareal') {
        return formatForVivaReal(property)
      } else if (format === 'zapimoveis') {
        return formatForZapImoveis(property)
      } else {
        return formatGeneric(property)
      }
    })

    return NextResponse.json({
      success: true,
      count: formattedProperties.length,
      properties: formattedProperties,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error exporting properties:', error)
    return NextResponse.json(
      { error: 'Error exporting properties' },
      { status: 500 }
    )
  }
}

/**
 * Formato específico para OLX
 */
function formatForOLX(property: any) {
  return {
    // IDs e referências
    external_id: property.id,
    reference: property.id,
    
    // Dados básicos
    title: property.title,
    description: property.description,
    type: mapPropertyTypeToOLX(property.type),
    
    // Preços
    rent_price: property.availableFor !== 'SALE' ? property.rentPrice : null,
    sale_price: property.availableFor !== 'RENT' ? property.salePrice : null,
    
    // Localização
    address: property.address,
    city: property.city,
    state: property.state,
    zipcode: property.zipCode,
    
    // Características
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    parking_spaces: property.parkingSpaces,
    
    // Comodidades
    amenities: JSON.parse(property.amenities || '[]'),
    
    // Status
    available: property.isAvailable,
    available_for: property.availableFor?.toLowerCase(),
    
    // Contato
    owner: {
      name: property.owner?.name,
      email: property.owner?.email,
      phone: property.owner?.phone
    },
    
    // Metadados
    created_at: property.createdAt,
    updated_at: property.updatedAt
  }
}

/**
 * Formato específico para VivaReal
 */
function formatForVivaReal(property: any) {
  return {
    ListingID: property.id,
    Title: property.title,
    Description: property.description,
    ListingType: property.availableFor === 'RENT' ? 'rent' : 'sale',
    PropertyType: mapPropertyTypeToVivaReal(property.type),
    
    // Preços
    Price: property.availableFor !== 'SALE' ? property.rentPrice : property.salePrice,
    RentPrice: property.rentPrice,
    SalePrice: property.salePrice,
    
    // Localização
    Address: property.address,
    City: property.city,
    State: property.state,
    ZipCode: property.zipCode,
    
    // Características
    Bedrooms: property.bedrooms,
    Bathrooms: property.bathrooms,
    Area: property.area,
    ParkingSpaces: property.parkingSpaces,
    
    // Status
    Available: property.isAvailable,
    
    // Contato
    ContactName: property.owner?.name,
    ContactEmail: property.owner?.email,
    ContactPhone: property.owner?.phone
  }
}

/**
 * Formato específico para ZapImóveis
 */
function formatForZapImoveis(property: any) {
  return {
    id: property.id,
    titulo: property.title,
    descricao: property.description,
    tipo: mapPropertyTypeToZap(property.type),
    finalidade: property.availableFor === 'RENT' ? 'aluguel' : 'venda',
    
    // Preços
    valor: property.availableFor !== 'SALE' ? property.rentPrice : property.salePrice,
    valorAluguel: property.rentPrice,
    valorVenda: property.salePrice,
    
    // Localização
    endereco: property.address,
    cidade: property.city,
    estado: property.state,
    cep: property.zipCode,
    
    // Características
    quartos: property.bedrooms,
    banheiros: property.bathrooms,
    area: property.area,
    vagas: property.parkingSpaces,
    
    // Status
    ativo: property.isAvailable,
    
    // Contato
    contato: {
      nome: property.owner?.name,
      email: property.owner?.email,
      telefone: property.owner?.phone
    }
  }
}

/**
 * Formato genérico
 */
function formatGeneric(property: any) {
  return {
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    rent_price: property.rentPrice,
    sale_price: property.salePrice,
    address: property.address,
    city: property.city,
    state: property.state,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    available: property.isAvailable,
    owner: property.owner
  }
}

/**
 * Mapear tipos de propriedade para cada portal
 */
function mapPropertyTypeToOLX(type: string): string {
  const typeMap: { [key: string]: string } = {
    'APARTMENT': 'apartamento',
    'HOUSE': 'casa',
    'LAND': 'terreno',
    'COMMERCIAL': 'comercial',
    'STUDIO': 'studio'
  }
  return typeMap[type] || 'apartamento'
}

function mapPropertyTypeToVivaReal(type: string): string {
  const typeMap: { [key: string]: string } = {
    'APARTMENT': 'apartment',
    'HOUSE': 'house',
    'LAND': 'land',
    'COMMERCIAL': 'commercial',
    'STUDIO': 'studio'
  }
  return typeMap[type] || 'apartment'
}

function mapPropertyTypeToZap(type: string): string {
  const typeMap: { [key: string]: string } = {
    'APARTMENT': 'apartamento',
    'HOUSE': 'casa',
    'LAND': 'terreno',
    'COMMERCIAL': 'comercial',
    'STUDIO': 'studio'
  }
  return typeMap[type] || 'apartamento'
}
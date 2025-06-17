import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const properties = await prisma.property.findMany({
      where: {
        userId: user.id
      },
      include: {
        owner: true,
        contracts: {
          include: {
            tenant: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse JSON strings back to arrays for SQLite compatibility
    const formattedProperties = properties.map(property => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      availableFor: property.availableFor ? JSON.parse(property.availableFor) : ['RENT']
    }))

    return NextResponse.json(formattedProperties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar imóveis' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    // Get owner to access companyId and verify ownership
    const owner = await prisma.owner.findUnique({
      where: { id: data.ownerId }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
    }

    // Verify that the owner belongs to the current user
    if (owner.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to owner' }, { status: 403 })
    }

    const property = await prisma.property.create({
      data: {
        title: data.title,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
        area: parseFloat(data.area),
        rentPrice: parseFloat(data.rentPrice),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
        propertyType: data.propertyType,
        status: data.status,
        availableFor: JSON.stringify(data.availableFor || ['RENT']),
        ownerId: data.ownerId,
        companyId: owner.companyId || user.companyId || '',
        userId: user.id,
        images: data.images || "[]",
        amenities: data.amenities || "[]"
      },
      include: {
        owner: true
      }
    })

    // Check for lead matches
    await checkForLeadMatches(property.id)

    // Format response for SQLite compatibility
    const formattedProperty = {
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : []
    }

    return NextResponse.json(formattedProperty, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar imóvel' },
      { status: 500 }
    )
  }
}

// Function to check for lead matches when a new property is created
async function checkForLeadMatches(propertyId: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true }
    })

    if (!property) return

    // Find leads that match this property
    const matchingLeads = await prisma.lead.findMany({
      where: {
        companyId: property.companyId,
        status: 'ACTIVE',
        propertyType: property.propertyType
      }
    })

    for (const lead of matchingLeads) {
      let isMatch = true
      const preferredCities = JSON.parse(lead.preferredCities)
      const preferredStates = JSON.parse(lead.preferredStates)

      // Check if property is available for the lead's interest
      const availableFor = JSON.parse(property.availableFor || '[]')
      
      if (lead.interest === 'RENT') {
        // Property must be available for rent and have a rent price > 0
        if (!availableFor.includes('RENT')) isMatch = false
        if (!property.rentPrice || property.rentPrice <= 0) isMatch = false
        if (lead.minPrice && property.rentPrice < lead.minPrice) isMatch = false
        if (property.rentPrice > lead.maxPrice) isMatch = false
      } else if (lead.interest === 'BUY') {
        // Property must be available for sale and have a sale price > 0
        if (!availableFor.includes('SALE')) isMatch = false
        if (!property.salePrice || property.salePrice <= 0) isMatch = false
        if (lead.minPrice && property.salePrice && property.salePrice < lead.minPrice) isMatch = false
        if (property.salePrice && property.salePrice > lead.maxPrice) isMatch = false
      }

      // Check bedrooms
      if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) isMatch = false
      if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) isMatch = false

      // Check bathrooms
      if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) isMatch = false
      if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) isMatch = false

      // Check area
      if (lead.minArea && property.area < lead.minArea) isMatch = false
      if (lead.maxArea && property.area > lead.maxArea) isMatch = false

      // Check location
      if (preferredCities.length > 0 && !preferredCities.includes(property.city)) {
        if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
          isMatch = false
        }
      }

      // If it's a match, create notification
      if (isMatch) {
        const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
        const priceFormatted = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(price || 0)

        await prisma.leadNotification.create({
          data: {
            leadId: lead.id,
            propertyId: property.id,
            type: 'PROPERTY_MATCH',
            title: `Novo imóvel encontrado para ${lead.name}`,
            message: `${property.title} - ${priceFormatted} (${lead.interest === 'RENT' ? 'Aluguel' : 'Venda'})`
          }
        })

        console.log(`Match found: Property ${property.title} matches lead ${lead.name}`)
      }
    }
  } catch (error) {
    console.error('Error checking for lead matches:', error)
  }
}
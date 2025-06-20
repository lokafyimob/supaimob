import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { checkForLeadMatches, checkForPartnershipOpportunities } from '@/lib/matching-service'

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
        city: data.city.toUpperCase(),
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
        amenities: data.amenities || "[]",
        acceptsPartnership: data.acceptsPartnership || false,
        acceptsFinancing: data.acceptsFinancing || false
      },
      include: {
        owner: true
      }
    })

    console.log('🏠 Propriedade criada:', property.id, property.title)
    console.log('🤝 Aceita parceria:', data.acceptsPartnership)
    
    // Executar auto-matching
    try {
      console.log('🤖 Executando auto-matching...')
      const matchingResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auto-matching`, {
        method: 'POST',
        headers: {
          'Cookie': request.headers.get('Cookie') || ''
        }
      })
      
      if (matchingResponse.ok) {
        const result = await matchingResponse.json()
        console.log('✅ Auto-matching concluído:', result.message)
      } else {
        console.log('⚠️ Auto-matching falhou:', matchingResponse.status)
      }
    } catch (error) {
      console.log('❌ Erro no auto-matching:', error)
    }

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

// Function to check for partnership opportunities when a property with partnership is created
async function checkForPartnershipOpportunities(propertyId: string, propertyOwnerId: string) {
  try {
    console.log('🤝 Checking partnership opportunities for property:', propertyId)
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!property) return

    const availableFor = JSON.parse(property.availableFor || '[]')
    
    // Find leads from other users that match this property
    const matchingLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { userId: { not: propertyOwnerId } }, // Not the property owner
          { status: 'ACTIVE' },
          { propertyType: property.propertyType },
          // Interest compatible with availability
          availableFor.includes('RENT') && availableFor.includes('SALE') ? {
            OR: [
              { interest: 'RENT' },
              { interest: 'BUY' }
            ]
          } : availableFor.includes('RENT') ? {
            interest: 'RENT'
          } : availableFor.includes('SALE') ? {
            interest: 'BUY'
          } : { interest: 'RENT' } // fallback
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    console.log(`👥 Found ${matchingLeads.length} matching leads for partnership`)

    for (const lead of matchingLeads) {
      // Detailed compatibility check
      const preferredCities = JSON.parse(lead.preferredCities || '[]')
      const preferredStates = JSON.parse(lead.preferredStates || '[]')
      
      let isMatch = true
      
      // Check price compatibility
      if (lead.interest === 'RENT' && property.rentPrice) {
        if (lead.minPrice && property.rentPrice < lead.minPrice) isMatch = false
        if (property.rentPrice > lead.maxPrice) isMatch = false
      } else if (lead.interest === 'BUY' && property.salePrice) {
        if (lead.minPrice && property.salePrice < lead.minPrice) isMatch = false
        if (property.salePrice > lead.maxPrice) isMatch = false
      }
      
      // Check rooms
      if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) isMatch = false
      if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) isMatch = false
      
      // Check bathrooms
      if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) isMatch = false
      if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) isMatch = false
      
      // Check area
      if (lead.minArea && property.area < lead.minArea) isMatch = false
      if (lead.maxArea && property.area > lead.maxArea) isMatch = false
      
      // Check location
      if (preferredCities.length > 0) {
        if (!preferredCities.includes(property.city)) {
          if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
            isMatch = false
          }
        }
      }
      
      if (!isMatch) continue
      
      // Check if notification already exists (last 24h)
      const existingNotification = await prisma.partnershipNotification.findFirst({
        where: {
          fromUserId: lead.userId,
          toUserId: propertyOwnerId,
          leadId: lead.id,
          propertyId: property.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
      
      if (!existingNotification) {
        const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
        
        // Buscar dados completos do dono do lead
        const leadOwner = await prisma.user.findUnique({
          where: { id: lead.userId },
          select: { name: true, email: true, phone: true }
        })
        
        // LÓGICA CORRIGIDA: Notificar dono do imóvel sobre dono do lead
        await prisma.partnershipNotification.create({
          data: {
            fromUserId: lead.userId, // Lead owner (quem TEM o cliente interessado)
            toUserId: propertyOwnerId, // Property owner (quem será notificado)
            leadId: lead.id,
            propertyId: property.id,
            fromUserName: leadOwner?.name || '', // Nome de quem TEM o cliente
            fromUserPhone: leadOwner?.phone || null, // Telefone de quem TEM o cliente
            fromUserEmail: leadOwner?.email || '',
            leadName: lead.name,
            leadPhone: lead.phone,
            propertyTitle: property.title,
            propertyPrice: targetPrice,
            matchType: lead.interest
          }
        })
        
        console.log(`✅ Partnership notification created: ${lead.name} (${lead.user.email}) for ${property.title}`)
      }
    }
    
  } catch (error) {
    console.error('Error checking partnership opportunities:', error)
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
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('Fetching leads for user:', user.id)
    
    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id
      },
      include: {
        matchedProperty: true,
        notifications: {
          include: {
            property: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found leads:', leads.length)
    
    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    // Get user's company
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    })

    if (!userData?.companyId) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document || null,
        interest: data.interest,
        propertyType: data.propertyType,
        minPrice: data.minPrice || null,
        maxPrice: data.maxPrice,
        minBedrooms: data.minBedrooms || null,
        maxBedrooms: data.maxBedrooms || null,
        minBathrooms: data.minBathrooms || null,
        maxBathrooms: data.maxBathrooms || null,
        minArea: data.minArea || null,
        maxArea: data.maxArea || null,
        preferredCities: JSON.stringify(data.preferredCities || []),
        preferredStates: JSON.stringify(data.preferredStates || []),
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
        notes: data.notes || null,
        status: data.status || 'ACTIVE',
        companyId: userData.companyId,
        userId: user.id,
        lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null
      },
      include: {
        matchedProperty: true,
        notifications: {
          include: {
            property: true
          }
        }
      }
    })

    // Check for immediate matches
    await checkForMatches(lead.id)

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Function to check for property matches
async function checkForMatches(leadId: string) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true }
    })

    if (!lead) return

    const preferredCities = JSON.parse(lead.preferredCities)
    const preferredStates = JSON.parse(lead.preferredStates)

    // Build query for matching properties
    const whereConditions: any = {
      companyId: lead.companyId,
      propertyType: lead.propertyType,
      status: 'AVAILABLE'
    }

    // Price range
    if (lead.interest === 'RENT') {
      whereConditions.rentPrice = {
        gte: lead.minPrice || 0,
        lte: lead.maxPrice
      }
    } else if (lead.interest === 'BUY') {
      whereConditions.salePrice = {
        gte: lead.minPrice || 0,
        lte: lead.maxPrice,
        not: null
      }
    }

    // Bedrooms
    if (lead.minBedrooms || lead.maxBedrooms) {
      whereConditions.bedrooms = {}
      if (lead.minBedrooms) whereConditions.bedrooms.gte = lead.minBedrooms
      if (lead.maxBedrooms) whereConditions.bedrooms.lte = lead.maxBedrooms
    }

    // Bathrooms
    if (lead.minBathrooms || lead.maxBathrooms) {
      whereConditions.bathrooms = {}
      if (lead.minBathrooms) whereConditions.bathrooms.gte = lead.minBathrooms
      if (lead.maxBathrooms) whereConditions.bathrooms.lte = lead.maxBathrooms
    }

    // Area
    if (lead.minArea || lead.maxArea) {
      whereConditions.area = {}
      if (lead.minArea) whereConditions.area.gte = lead.minArea
      if (lead.maxArea) whereConditions.area.lte = lead.maxArea
    }

    // Cities and states
    if (preferredCities.length > 0 || preferredStates.length > 0) {
      whereConditions.OR = []
      if (preferredCities.length > 0) {
        whereConditions.OR.push({ city: { in: preferredCities } })
      }
      if (preferredStates.length > 0) {
        whereConditions.OR.push({ state: { in: preferredStates } })
      }
    }

    const matchingProperties = await prisma.property.findMany({
      where: whereConditions,
      include: {
        owner: true
      }
    })

    // Create notifications for matches
    for (const property of matchingProperties) {
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
          title: `Imóvel encontrado para ${lead.name}`,
          message: `${property.title} - ${priceFormatted} (${lead.interest === 'RENT' ? 'Aluguel' : 'Venda'})`
        }
      })
    }

    console.log(`Found ${matchingProperties.length} matches for lead ${lead.name}`)
  } catch (error) {
    console.error('Error checking for matches:', error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
    
    const lead = await prisma.lead.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    const preferredCities = JSON.parse(lead.preferredCities)
    const preferredStates = JSON.parse(lead.preferredStates)

    // Build base conditions
    const baseConditions: any = {
      companyId: lead.companyId,
      propertyType: lead.propertyType,
      status: 'AVAILABLE'
    }

    // Build AND conditions array
    const andConditions: any[] = []

    // Available for condition - mais rigoroso
    if (lead.interest === 'RENT') {
      andConditions.push({
        OR: [
          { availableFor: { contains: '"RENT"' } },
          { availableFor: { contains: 'RENT' } }
        ]
      })
      andConditions.push({
        rentPrice: {
          gt: 0, // Must have a rent price > 0
          gte: lead.minPrice || 0,
          lte: lead.maxPrice
        }
      })
    } else if (lead.interest === 'BUY') {
      andConditions.push({
        OR: [
          { availableFor: { contains: '"SALE"' } },
          { availableFor: { contains: 'SALE' } }
        ]
      })
      andConditions.push({
        salePrice: {
          gt: 0, // Must have a sale price > 0
          gte: lead.minPrice || 0,
          lte: lead.maxPrice,
          not: null
        }
      })
    }

    // Bedrooms
    if (lead.minBedrooms || lead.maxBedrooms) {
      const bedroomsCondition: any = {}
      if (lead.minBedrooms) bedroomsCondition.gte = lead.minBedrooms
      if (lead.maxBedrooms) bedroomsCondition.lte = lead.maxBedrooms
      andConditions.push({ bedrooms: bedroomsCondition })
    }

    // Bathrooms
    if (lead.minBathrooms || lead.maxBathrooms) {
      const bathroomsCondition: any = {}
      if (lead.minBathrooms) bathroomsCondition.gte = lead.minBathrooms
      if (lead.maxBathrooms) bathroomsCondition.lte = lead.maxBathrooms
      andConditions.push({ bathrooms: bathroomsCondition })
    }

    // Area
    if (lead.minArea || lead.maxArea) {
      const areaCondition: any = {}
      if (lead.minArea) areaCondition.gte = lead.minArea
      if (lead.maxArea) areaCondition.lte = lead.maxArea
      andConditions.push({ area: areaCondition })
    }

    // Cities and states
    if (preferredCities.length > 0 || preferredStates.length > 0) {
      const locationConditions: any[] = []
      if (preferredCities.length > 0) {
        locationConditions.push({ city: { in: preferredCities } })
      }
      if (preferredStates.length > 0) {
        locationConditions.push({ state: { in: preferredStates } })
      }
      andConditions.push({ OR: locationConditions })
    }

    // Build final where conditions
    const whereConditions = {
      ...baseConditions,
      AND: andConditions
    }

    console.log('=== MATCHING DEBUG ===')
    console.log('Lead data:', {
      id: id,
      interest: lead.interest,
      cities: preferredCities,
      states: preferredStates,
      minPrice: lead.minPrice,
      maxPrice: lead.maxPrice
    })
    console.log('Where conditions:', JSON.stringify(whereConditions, null, 2))

    const matchingProperties = await prisma.property.findMany({
      where: whereConditions,
      include: {
        owner: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found properties before filtering:', matchingProperties.map(p => ({
      id: p.id,
      title: p.title,
      city: p.city,
      availableFor: p.availableFor,
      rentPrice: p.rentPrice,
      salePrice: p.salePrice
    })))

    // Additional JavaScript filtering to ensure exact matches
    const exactMatches = matchingProperties.filter(property => {
      const availableFor = JSON.parse(property.availableFor || '[]')
      console.log(`Checking property ${property.title}:`, {
        availableFor,
        leadInterest: lead.interest,
        includes: availableFor.includes(lead.interest === 'RENT' ? 'RENT' : 'SALE')
      })
      
      // Must be available for the lead's interest
      if (lead.interest === 'RENT' && !availableFor.includes('RENT')) {
        console.log(`❌ Property ${property.title} not available for RENT`)
        return false
      }
      if (lead.interest === 'BUY' && !availableFor.includes('SALE')) {
        console.log(`❌ Property ${property.title} not available for SALE`)
        return false
      }
      
      // Check city (must match exactly if specified)
      if (preferredCities.length > 0 && !preferredCities.includes(property.city)) {
        console.log(`❌ Property ${property.title} city ${property.city} not in preferred cities:`, preferredCities)
        return false
      }
      
      // Check price range
      const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
      if (!targetPrice || targetPrice <= 0) {
        console.log(`❌ Property ${property.title} has no valid price for ${lead.interest}`)
        return false
      }
      
      if (lead.minPrice && targetPrice < lead.minPrice) {
        console.log(`❌ Property ${property.title} price ${targetPrice} below min ${lead.minPrice}`)
        return false
      }
      
      if (targetPrice > lead.maxPrice) {
        console.log(`❌ Property ${property.title} price ${targetPrice} above max ${lead.maxPrice}`)
        return false
      }
      
      console.log(`✅ Property ${property.title} matches all criteria`)
      return true
    })

    console.log('Final exact matches:', exactMatches.length)

    // Calculate match score for each property
    const propertiesWithScore = exactMatches.map(property => {
      let score = 0
      const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice

      // Price score (closer to max budget = higher score)
      if (targetPrice && lead.maxPrice) {
        const priceRatio = targetPrice / lead.maxPrice
        score += (1 - Math.abs(1 - priceRatio)) * 30
      }

      // Bedrooms score
      if (lead.minBedrooms && property.bedrooms >= lead.minBedrooms) score += 20
      if (lead.maxBedrooms && property.bedrooms <= lead.maxBedrooms) score += 20

      // Location score
      if (preferredCities.includes(property.city)) score += 20
      if (preferredStates.includes(property.state)) score += 10

      return {
        ...property,
        matchScore: Math.round(score)
      }
    })

    // Sort by match score
    propertiesWithScore.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json(propertiesWithScore)
  } catch (error) {
    console.error('Error finding matches:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar matches' },
      { status: 500 }
    )
  }
}
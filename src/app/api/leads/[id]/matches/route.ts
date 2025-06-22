import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
    
    console.log('🔍 Buscando matches para lead:', id)
    
    // Use raw SQL to avoid Prisma issues
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Get lead details
    const leadQuery = `
      SELECT * FROM leads 
      WHERE id = $1 AND "userId" = $2
    `
    const leadResult = await client.query(leadQuery, [id, user.id])

    if (leadResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    const lead = leadResult.rows[0]
    const preferredCities = JSON.parse(lead.preferredCities || '[]')
    const preferredStates = JSON.parse(lead.preferredStates || '[]')

    console.log('📋 Lead data:', {
      id: lead.id,
      name: lead.name,
      interest: lead.interest,
      propertyType: lead.propertyType,
      minPrice: lead.minPrice,
      maxPrice: lead.maxPrice,
      cities: preferredCities,
      states: preferredStates
    })

    // Build SQL query for matching properties
    let whereConditions = [`p."companyId" = $1`, `p.status = 'AVAILABLE'`, `p."propertyType" = $2`]
    let queryParams = [lead.companyId, lead.propertyType]
    let paramCount = 2

    // Price conditions
    if (lead.interest === 'RENT') {
      paramCount++
      whereConditions.push(`p."rentPrice" IS NOT NULL AND p."rentPrice" > 0`)
      whereConditions.push(`p."rentPrice" BETWEEN $${paramCount} AND $${paramCount + 1}`)
      queryParams.push(lead.minPrice || 0, lead.maxPrice)
      paramCount++
    } else if (lead.interest === 'BUY') {
      paramCount++
      whereConditions.push(`p."salePrice" IS NOT NULL AND p."salePrice" > 0`)
      whereConditions.push(`p."salePrice" BETWEEN $${paramCount} AND $${paramCount + 1}`)
      queryParams.push(lead.minPrice || 0, lead.maxPrice)
      paramCount++
    }

    // Bedrooms
    if (lead.minBedrooms) {
      paramCount++
      whereConditions.push(`p.bedrooms >= $${paramCount}`)
      queryParams.push(lead.minBedrooms)
    }
    if (lead.maxBedrooms) {
      paramCount++
      whereConditions.push(`p.bedrooms <= $${paramCount}`)
      queryParams.push(lead.maxBedrooms)
    }

    // Bathrooms
    if (lead.minBathrooms) {
      paramCount++
      whereConditions.push(`p.bathrooms >= $${paramCount}`)
      queryParams.push(lead.minBathrooms)
    }
    if (lead.maxBathrooms) {
      paramCount++
      whereConditions.push(`p.bathrooms <= $${paramCount}`)
      queryParams.push(lead.maxBathrooms)
    }

    // Area
    if (lead.minArea) {
      paramCount++
      whereConditions.push(`p.area >= $${paramCount}`)
      queryParams.push(lead.minArea)
    }
    if (lead.maxArea) {
      paramCount++
      whereConditions.push(`p.area <= $${paramCount}`)
      queryParams.push(lead.maxArea)
    }

    // Cities (if specified)
    if (preferredCities.length > 0) {
      paramCount++
      const cityPlaceholders = preferredCities.map((_, index) => `$${paramCount + index}`).join(', ')
      whereConditions.push(`p.city IN (${cityPlaceholders})`)
      queryParams.push(...preferredCities)
      paramCount += preferredCities.length - 1
    }

    const propertiesQuery = `
      SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p."createdAt" DESC
      LIMIT 50
    `

    console.log('🔍 Query SQL:', propertiesQuery)
    console.log('📝 Parâmetros:', queryParams)

    const propertiesResult = await client.query(propertiesQuery, queryParams)
    const matchingProperties = propertiesResult.rows

    console.log(`🏠 Propriedades encontradas: ${matchingProperties.length}`)

    // Additional filtering and scoring
    const exactMatches = matchingProperties.filter(property => {
      // Check availableFor field
      const availableFor = JSON.parse(property.availableFor || '[]')
      const neededType = lead.interest === 'RENT' ? 'RENT' : 'SALE'
      
      if (!availableFor.includes(neededType)) {
        console.log(`❌ Property ${property.title} not available for ${neededType}`)
        return false
      }
      
      console.log(`✅ Property ${property.title} matches all criteria`)
      return true
    })

    console.log(`🎯 Matches exatos: ${exactMatches.length}`)

    // Calculate match score
    const propertiesWithScore = exactMatches.map(property => {
      let score = 0
      const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice

      // Price score
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
        id: property.id,
        title: property.title,
        description: property.description,
        address: property.address,
        city: property.city,
        state: property.state,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        rentPrice: property.rentPrice,
        salePrice: property.salePrice,
        propertyType: property.propertyType,
        images: property.images ? JSON.parse(property.images) : [],
        amenities: property.amenities ? JSON.parse(property.amenities) : [],
        matchScore: Math.round(score),
        owner: {
          id: property.userId,
          name: property.ownerName,
          email: property.ownerEmail,
          phone: property.ownerPhone
        }
      }
    })

    // Sort by match score
    propertiesWithScore.sort((a, b) => b.matchScore - a.matchScore)

    await client.end()

    return NextResponse.json(propertiesWithScore)
  } catch (error) {
    console.error('❌ Error finding matches:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar matches', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
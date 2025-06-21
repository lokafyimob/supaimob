import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { checkForMatches } from '@/lib/matching-service'

export async function GET(request: NextRequest) {
  try {
    console.log('=== GET LEADS with RAW SQL (like simple API) ===')
    
    const user = await requireAuth(request)
    console.log('User authenticated:', user.id)
    
    // Use the exact same approach as the working simple API
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    const query = `
      SELECT id, name, email, phone, interest, "propertyType", "maxPrice", "minPrice", 
             "minBedrooms", "maxBedrooms", "minBathrooms", "maxBathrooms", 
             "minArea", "maxArea", "preferredCities", "preferredStates", 
             amenities, notes, status, "needsFinancing", "createdAt", "updatedAt"
      FROM leads 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
    `
    
    const result = await client.query(query, [user.id])
    await client.end()
    
    console.log('Raw SQL found leads:', result.rows.length)
    
    return NextResponse.json(result.rows)
    
  } catch (error) {
    console.error('❌ GET leads error:', error)
    return NextResponse.json({
      error: 'Failed to fetch leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    console.log('Creating lead with data:', JSON.stringify(data, null, 2))
    
    // Get user's company
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    })

    if (!userData?.companyId) {
      console.error('User company not found for user:', user.id)
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    console.log('Creating lead in database...')
    
    // Generate ID manually like in raw SQL
    const leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    let createdLead = null
    
    // Try Prisma first, fallback to raw SQL
    try {
      console.log('🔄 Attempting Prisma lead creation...')
      
      createdLead = await prisma.lead.create({
        data: {
          id: leadId,
          name: String(data.name),
          email: String(data.email),
          phone: String(data.phone),
          interest: data.interest || 'RENT',
          propertyType: data.propertyType || 'APARTMENT',
          maxPrice: data.maxPrice || 1000.0,
          minPrice: data.minPrice || null,
          minBedrooms: data.minBedrooms || null,
          maxBedrooms: data.maxBedrooms || null,
          minBathrooms: data.minBathrooms || null,
          maxBathrooms: data.maxBathrooms || null,
          minArea: data.minArea || null,
          maxArea: data.maxArea || null,
          preferredCities: JSON.stringify((data.preferredCities || []).filter((city: string) => city && city.trim()).map((city: string) => city.toUpperCase())),
          preferredStates: JSON.stringify(Array.isArray(data.preferredStates) ? data.preferredStates : []),
          amenities: data.amenities ? JSON.stringify(data.amenities) : null,
          notes: data.notes || null,
          status: data.status || 'ACTIVE',
          companyId: String(userData.companyId),
          userId: String(user.id),
          lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
          needsFinancing: data.needsFinancing || false
        }
      })
      
      console.log('✅ Prisma lead created:', createdLead.id)
      
    } catch (prismaError) {
      console.error('❌ Prisma failed, trying raw SQL fallback...')
      console.error('Prisma error details:', prismaError)
      
      // Fallback to raw SQL if Prisma fails
      const { Client } = require('pg')
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })
      
      await client.connect()
      
      const insertQuery = `
        INSERT INTO leads (
          id, name, email, phone, interest, "propertyType", "maxPrice", 
          "preferredCities", "preferredStates", status, "companyId", "userId", 
          "needsFinancing", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `
      
      const values = [
        leadId,
        data.name,
        data.email,
        data.phone,
        data.interest || 'RENT',
        data.propertyType || 'APARTMENT', 
        data.maxPrice || 1000.0,
        JSON.stringify((data.preferredCities || []).filter((city: string) => city && city.trim()).map((city: string) => city.toUpperCase())),
        JSON.stringify(Array.isArray(data.preferredStates) ? data.preferredStates : []),
        data.status || 'ACTIVE',
        userData.companyId,
        user.id,
        data.needsFinancing || false
      ]
      
      const result = await client.query(insertQuery, values)
      await client.end()
      
      console.log('✅ Fallback SQL lead created:', result.rows[0].id)
      createdLead = result.rows[0]
    }

    console.log('Lead created successfully:', createdLead?.id)

    // Executar auto-matching diretamente
    try {
      console.log('🤖 Lead criado, executando auto-matching...')
      
      // Import matching service directly
      const { checkForLeadMatches } = require('@/lib/matching-service')
      
      // Execute matching for the created lead
      const matchResults = await checkForLeadMatches(createdLead.id, user.id)
      console.log('✅ Auto-matching executado:', matchResults)
      
    } catch (error) {
      console.log('❌ Erro no auto-matching:', error)
    }

    return NextResponse.json(createdLead, { status: 201 })
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
    const whereConditions: Record<string, any> = {
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
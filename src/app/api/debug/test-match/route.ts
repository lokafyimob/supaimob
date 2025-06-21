import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { leadId } = await request.json()
    
    console.log('=== DEBUGGING MATCHING SYSTEM ===')
    console.log('User ID:', user.id)
    console.log('Lead ID:', leadId)
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 })
    }
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // 1. Verificar se o lead existe
    const leadQuery = `
      SELECT l.*, u.name as userName, u.email as userEmail, u.phone as userPhone
      FROM leads l
      JOIN users u ON l."userId" = u.id
      WHERE l.id = $1
    `
    const leadResult = await client.query(leadQuery, [leadId])
    
    if (leadResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }
    
    const lead = leadResult.rows[0]
    console.log('📋 Lead encontrado:', {
      name: lead.name,
      interest: lead.interest,
      propertyType: lead.propertyType,
      minPrice: lead.minPrice,
      maxPrice: lead.maxPrice,
      userId: lead.userId
    })
    
    // 2. Verificar propriedades do mesmo usuário
    const userPropertiesQuery = `
      SELECT p.id, p.title, p."propertyType", p."rentPrice", p."salePrice", p.status
      FROM properties p
      WHERE p."userId" = $1
    `
    const userPropertiesResult = await client.query(userPropertiesQuery, [lead.userId])
    
    console.log('🏠 Propriedades do usuário:', userPropertiesResult.rows.length)
    userPropertiesResult.rows.forEach(p => {
      console.log(`  - ${p.title}: ${p.propertyType} | Rent: R$ ${p.rentPrice} | Sale: R$ ${p.salePrice} | Status: ${p.status}`)
    })
    
    // 3. Verificar se há propriedades que fazem match
    const matchQuery = `
      SELECT p.*, u.name as ownerName
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" = $1 
        AND p.status = 'AVAILABLE'
        AND p."propertyType" = $2
        AND (
          (p."rentPrice" IS NOT NULL AND $3 = 'RENT') OR
          (p."salePrice" IS NOT NULL AND $3 = 'BUY')
        )
        AND (
          ($3 = 'RENT' AND p."rentPrice" BETWEEN $4 AND $5) OR
          ($3 = 'BUY' AND p."salePrice" BETWEEN $4 AND $5)
        )
    `
    
    const matchResult = await client.query(matchQuery, [
      lead.userId,
      lead.propertyType,
      lead.interest,
      lead.minPrice || 0,
      lead.maxPrice || 999999999
    ])
    
    console.log('🎯 Matches encontrados:', matchResult.rows.length)
    matchResult.rows.forEach(p => {
      const price = lead.interest === 'RENT' ? p.rentPrice : p.salePrice
      console.log(`  - ${p.title}: R$ ${price}`)
    })
    
    // 4. Verificar notificações existentes
    const notificationsQuery = `
      SELECT COUNT(*) as count FROM lead_notifications WHERE "leadId" = $1
    `
    const notificationsResult = await client.query(notificationsQuery, [leadId])
    
    console.log('🔔 Notificações existentes:', notificationsResult.rows[0].count)
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      lead: {
        name: lead.name,
        interest: lead.interest,
        propertyType: lead.propertyType,
        minPrice: lead.minPrice,
        maxPrice: lead.maxPrice
      },
      userProperties: userPropertiesResult.rows.length,
      matches: matchResult.rows.length,
      matchDetails: matchResult.rows.map(p => ({
        title: p.title,
        price: lead.interest === 'RENT' ? p.rentPrice : p.salePrice
      })),
      existingNotifications: notificationsResult.rows[0].count
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
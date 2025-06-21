import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Buscar propriedades do usuário
    const propertiesQuery = `
      SELECT id, title, "propertyType", "rentPrice", "salePrice", status, "updatedAt"
      FROM properties 
      WHERE "userId" = $1 
      ORDER BY "updatedAt" DESC
      LIMIT 10
    `
    const propertiesResult = await client.query(propertiesQuery, [user.id])
    
    // Buscar leads do usuário
    const leadsQuery = `
      SELECT id, name, interest, "propertyType", "minPrice", "maxPrice", "updatedAt"
      FROM leads 
      WHERE "userId" = $1 
      ORDER BY "updatedAt" DESC
      LIMIT 10
    `
    const leadsResult = await client.query(leadsQuery, [user.id])
    
    // Buscar notificações do usuário (todas, não só não enviadas)
    const notificationsQuery = `
      SELECT 
        ln.id, ln."leadId", ln."propertyId", ln.title, ln.message, 
        ln.sent, ln."createdAt",
        l.name as "leadName",
        p.title as "propertyTitle"
      FROM lead_notifications ln
      JOIN leads l ON ln."leadId" = l.id
      JOIN properties p ON ln."propertyId" = p.id
      WHERE l."userId" = $1
      ORDER BY ln."createdAt" DESC
      LIMIT 10
    `
    const notificationsResult = await client.query(notificationsQuery, [user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      properties: propertiesResult.rows,
      leads: leadsResult.rows,
      notifications: notificationsResult.rows,
      instructions: {
        testPropertyMatching: "Use POST /api/debug/test-property-match com propertyId de uma das propriedades acima",
        testNotificationCreation: "Use POST /api/debug/force-notification para criar uma notificação de teste"
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error)
    return NextResponse.json({
      error: 'Erro ao buscar dados do usuário',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
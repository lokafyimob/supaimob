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
    
    // Verificar leads do usuário
    const leadsQuery = `
      SELECT id, name, interest, "propertyType", "minPrice", "maxPrice", "createdAt"
      FROM leads 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
      LIMIT 3
    `
    const leadsResult = await client.query(leadsQuery, [user.id])
    
    // Verificar propriedades do usuário
    const propertiesQuery = `
      SELECT id, title, "propertyType", "rentPrice", "salePrice", status
      FROM properties 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
      LIMIT 3
    `
    const propertiesResult = await client.query(propertiesQuery, [user.id])
    
    // Verificar TODAS as notificações (não só as não enviadas)
    const allNotificationsQuery = `
      SELECT 
        ln.id, ln."leadId", ln."propertyId", ln.type, ln.title, ln.message, 
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
    const allNotificationsResult = await client.query(allNotificationsQuery, [user.id])
    
    // Verificar notificações não enviadas especificamente
    const unsentNotificationsQuery = `
      SELECT 
        ln.id, ln."leadId", ln."propertyId", ln.type, ln.title, ln.message, 
        ln.sent, ln."createdAt",
        l.name as "leadName",
        l.phone as "leadPhone",
        l.interest as "matchType",
        p.title as "propertyTitle",
        CASE 
          WHEN l.interest = 'RENT' THEN p."rentPrice"
          ELSE p."salePrice"
        END as "propertyPrice"
      FROM lead_notifications ln
      JOIN leads l ON ln."leadId" = l.id
      JOIN properties p ON ln."propertyId" = p.id
      WHERE l."userId" = $1 AND ln.sent = false
      ORDER BY ln."createdAt" DESC
    `
    const unsentResult = await client.query(unsentNotificationsQuery, [user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      leads: leadsResult.rows,
      properties: propertiesResult.rows,
      allNotifications: allNotificationsResult.rows,
      unsentNotifications: unsentResult.rows,
      summary: {
        totalLeads: leadsResult.rows.length,
        totalProperties: propertiesResult.rows.length,
        totalNotifications: allNotificationsResult.rows.length,
        unsentCount: unsentResult.rows.length
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    return NextResponse.json({
      error: 'Erro no debug de notificações',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
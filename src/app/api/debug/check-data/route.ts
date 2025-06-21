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
      LIMIT 5
    `
    const leadsResult = await client.query(leadsQuery, [user.id])
    
    // Verificar propriedades do usuário
    const propertiesQuery = `
      SELECT id, title, "propertyType", "rentPrice", "salePrice", status, "createdAt"
      FROM properties 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
      LIMIT 5
    `
    const propertiesResult = await client.query(propertiesQuery, [user.id])
    
    // Verificar notificações
    const notificationsQuery = `
      SELECT COUNT(*) as count FROM lead_notifications
    `
    const notificationsResult = await client.query(notificationsQuery)
    
    // Verificar estrutura da tabela properties
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      ORDER BY ordinal_position
    `
    const structureResult = await client.query(structureQuery)
    
    await client.end()
    
    return NextResponse.json({
      userId: user.id,
      leads: leadsResult.rows,
      properties: propertiesResult.rows,
      totalNotifications: parseInt(notificationsResult.rows[0].count),
      propertiesTableStructure: structureResult.rows
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      error: 'Erro no debug',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
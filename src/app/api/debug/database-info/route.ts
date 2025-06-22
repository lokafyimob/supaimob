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
    
    // Total de usuários
    const usersQuery = `SELECT COUNT(*) as total FROM users`
    const usersResult = await client.query(usersQuery)
    
    // Propriedades por usuário
    const propertiesQuery = `
      SELECT u.name, u.id, COUNT(p.id) as properties, 
             SUM(CASE WHEN p."acceptsPartnership" = true THEN 1 ELSE 0 END) as with_partnership
      FROM users u
      LEFT JOIN properties p ON u.id = p."userId"
      GROUP BY u.id, u.name
      ORDER BY properties DESC
    `
    const propertiesResult = await client.query(propertiesQuery)
    
    // Leads por usuário
    const leadsQuery = `
      SELECT u.name, u.id, COUNT(l.id) as leads
      FROM users u
      LEFT JOIN leads l ON u.id = l."userId"
      GROUP BY u.id, u.name
      ORDER BY leads DESC
    `
    const leadsResult = await client.query(leadsQuery)
    
    // Partnership notifications
    const partnershipQuery = `SELECT COUNT(*) as total FROM partnership_notifications`
    const partnershipResult = await client.query(partnershipQuery)
    
    // Lead notifications
    const leadNotifQuery = `SELECT COUNT(*) as total FROM lead_notifications`
    const leadNotifResult = await client.query(leadNotifQuery)
    
    await client.end()
    
    return NextResponse.json({
      totalUsers: usersResult.rows[0].total,
      propertiesByUser: propertiesResult.rows,
      leadsByUser: leadsResult.rows,
      totalPartnershipNotifications: partnershipResult.rows[0].total,
      totalLeadNotifications: leadNotifResult.rows[0].total,
      currentUserId: user.id
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar info do banco:', error)
    return NextResponse.json({
      error: 'Erro ao buscar informações',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
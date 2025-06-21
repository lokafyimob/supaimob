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
    
    console.log('🔍 Buscando notificações de parceria com raw SQL...')
    
    // Buscar notificações de parceria para o usuário atual
    const notificationsQuery = `
      SELECT 
        id,
        "fromUserId",
        "toUserId", 
        "leadId",
        "propertyId",
        "fromUserName",
        "fromUserPhone",
        "fromUserEmail",
        "leadName",
        "leadPhone", 
        "propertyTitle",
        "propertyPrice",
        "matchType",
        viewed,
        "createdAt"
      FROM partnership_notifications
      WHERE "toUserId" = $1 
        AND viewed = false
      ORDER BY "createdAt" DESC
      LIMIT 10
    `
    
    const result = await client.query(notificationsQuery, [user.id])
    const notifications = result.rows
    
    await client.end()
    
    console.log(`📨 ${notifications.length} notificações de parceria encontradas`)
    
    return NextResponse.json({
      success: true,
      notifications: notifications
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar notificações de parceria:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { notificationIds } = await request.json()
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'IDs de notificação inválidos' }, { status: 400 })
    }
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    console.log('✅ Marcando notificações como visualizadas:', notificationIds)
    
    // Marcar notificações como visualizadas
    const updateQuery = `
      UPDATE partnership_notifications 
      SET viewed = true, "viewedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ANY($1::text[]) 
        AND "toUserId" = $2
    `
    
    await client.query(updateQuery, [notificationIds, user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'Notificações marcadas como visualizadas'
    })
    
  } catch (error) {
    console.error('❌ Erro ao marcar notificações como visualizadas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
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
    
    // Buscar notificações de leads do usuário
    const notificationsQuery = `
      SELECT 
        ln.id,
        ln."leadId",
        ln."propertyId", 
        ln.type,
        ln.title,
        ln.message,
        ln.sent,
        ln."createdAt",
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
      WHERE l."userId" = $1
        AND ln.sent = false
      ORDER BY ln."createdAt" DESC
      LIMIT 20
    `
    
    const result = await client.query(notificationsQuery, [user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      notifications: result.rows
    })
    
  } catch (error) {
    console.error('❌ Erro ao buscar notificações:', error)
    return NextResponse.json({
      error: 'Erro ao buscar notificações',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { notificationIds, reset } = await request.json()
    
    // Se reset = true, resetar todas as notificações para sent = false
    if (reset === true) {
      const { Client } = require('pg')
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })
      
      await client.connect()
      
      const resetQuery = `
        UPDATE lead_notifications 
        SET sent = false, "sentAt" = NULL
        WHERE "leadId" IN (
          SELECT id FROM leads WHERE "userId" = $1
        )
      `
      
      const result = await client.query(resetQuery, [user.id])
      await client.end()
      
      return NextResponse.json({
        success: true,
        message: `${result.rowCount} notificações resetadas para aparecer novamente!`,
        resetCount: result.rowCount
      })
    }
    
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'IDs de notificação obrigatórios' }, { status: 400 })
    }
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Marcar notificações como enviadas
    const updateQuery = `
      UPDATE lead_notifications 
      SET sent = true, "sentAt" = NOW()
      WHERE id = ANY($1::text[])
        AND "leadId" IN (
          SELECT id FROM leads WHERE "userId" = $2
        )
    `
    
    await client.query(updateQuery, [notificationIds, user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'Notificações marcadas como enviadas'
    })
    
  } catch (error) {
    console.error('❌ Erro ao atualizar notificações:', error)
    return NextResponse.json({
      error: 'Erro ao atualizar notificações',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
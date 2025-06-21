import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Buscar primeiro lead do usuário
    const leadQuery = `SELECT id, name FROM leads WHERE "userId" = $1 LIMIT 1`
    const leadResult = await client.query(leadQuery, [user.id])
    
    if (leadResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Nenhum lead encontrado' }, { status: 400 })
    }
    
    // Buscar primeira propriedade do usuário
    const propertyQuery = `SELECT id, title FROM properties WHERE "userId" = $1 LIMIT 1`
    const propertyResult = await client.query(propertyQuery, [user.id])
    
    if (propertyResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Nenhuma propriedade encontrada' }, { status: 400 })
    }
    
    const lead = leadResult.rows[0]
    const property = propertyResult.rows[0]
    
    // Criar notificação FORÇADA
    const notificationId = 'FORCE_' + Date.now()
    
    const insertQuery = `
      INSERT INTO lead_notifications (
        id, "leadId", "propertyId", type, title, message, sent, "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `
    
    const insertResult = await client.query(insertQuery, [
      notificationId,
      lead.id,
      property.id,
      'PROPERTY_MATCH',
      `🚨 TESTE FORÇADO: Match para ${lead.name}`,
      `Notificação de teste criada manualmente para verificar se o sistema funciona. Lead: ${lead.name} x Propriedade: ${property.title}`,
      false  // NÃO ENVIADA - deve aparecer na interface
    ])
    
    await client.end()
    
    console.log('🚨 NOTIFICAÇÃO FORÇADA CRIADA:', insertResult.rows[0])
    
    return NextResponse.json({
      success: true,
      message: 'Notificação de teste FORÇADA criada!',
      notification: insertResult.rows[0],
      instructions: 'Agora recarregue a página de leads para ver o alerta aparecer!'
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar notificação forçada:', error)
    return NextResponse.json({
      error: 'Erro ao criar notificação de teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
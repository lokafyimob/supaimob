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
    
    // Buscar um lead qualquer do usuário
    const leadQuery = `SELECT id, name FROM leads WHERE "userId" = $1 LIMIT 1`
    const leadResult = await client.query(leadQuery, [user.id])
    
    if (leadResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Nenhum lead encontrado para teste' }, { status: 400 })
    }
    
    // Buscar uma propriedade qualquer do usuário
    const propertyQuery = `SELECT id, title FROM properties WHERE "userId" = $1 LIMIT 1`
    const propertyResult = await client.query(propertyQuery, [user.id])
    
    if (propertyResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Nenhuma propriedade encontrada para teste' }, { status: 400 })
    }
    
    const lead = leadResult.rows[0]
    const property = propertyResult.rows[0]
    
    // Criar notificação de teste
    const notificationId = 'test_match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
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
      `🎯 TESTE: Match para ${lead.name}`,
      `Teste de notificação: ${property.title} faz match com ${lead.name}`,
      false
    ])
    
    await client.end()
    
    console.log('✅ Notificação de teste criada:', insertResult.rows[0])
    
    return NextResponse.json({
      success: true,
      message: 'Notificação de teste criada com sucesso!',
      notification: insertResult.rows[0],
      lead: { id: lead.id, name: lead.name },
      property: { id: property.id, title: property.title }
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar notificação de teste:', error)
    return NextResponse.json({
      error: 'Erro ao criar notificação de teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
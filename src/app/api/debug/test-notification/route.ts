import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { leadId, propertyId } = await request.json()
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID obrigatório' }, { status: 400 })
    }
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Verificar se lead existe
    const leadCheck = await client.query('SELECT id, name FROM leads WHERE id = $1', [leadId])
    if (leadCheck.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }
    
    // Verificar estrutura da tabela lead_notifications
    const structureQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'lead_notifications' 
      ORDER BY ordinal_position
    `
    const structureResult = await client.query(structureQuery)
    
    console.log('📋 Estrutura da tabela lead_notifications:', structureResult.rows)
    
    // Buscar uma propriedade qualquer para teste
    let testPropertyId = propertyId
    if (!testPropertyId) {
      const propResult = await client.query('SELECT id FROM properties WHERE "userId" = $1 LIMIT 1', [user.id])
      if (propResult.rows.length > 0) {
        testPropertyId = propResult.rows[0].id
      }
    }
    
    if (!testPropertyId) {
      await client.end()
      return NextResponse.json({ error: 'Nenhuma propriedade encontrada para teste' }, { status: 400 })
    }
    
    // Tentar criar uma notificação de teste
    const notificationId = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    try {
      const insertResult = await client.query(`
        INSERT INTO lead_notifications (
          id, "leadId", "propertyId", type, title, message, sent, "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        notificationId,
        leadId,
        testPropertyId,
        'PROPERTY_MATCH',
        'Teste de Notificação',
        'Esta é uma notificação de teste para verificar se o sistema funciona',
        false
      ])
      
      console.log('✅ Notificação de teste criada:', insertResult.rows[0])
      
      // Verificar se foi realmente criada
      const verifyResult = await client.query('SELECT * FROM lead_notifications WHERE id = $1', [notificationId])
      
      await client.end()
      
      return NextResponse.json({
        success: true,
        message: 'Notificação de teste criada com sucesso',
        notification: insertResult.rows[0],
        verified: verifyResult.rows.length > 0,
        tableStructure: structureResult.rows
      })
      
    } catch (insertError) {
      console.error('❌ Erro ao inserir notificação:', insertError)
      await client.end()
      
      return NextResponse.json({
        error: 'Erro ao criar notificação de teste',
        details: insertError instanceof Error ? insertError.message : 'Unknown error',
        tableStructure: structureResult.rows
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      error: 'Erro no teste de notificação',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { leadId } = await request.json()
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID obrigatório' }, { status: 400 })
    }
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Buscar lead
    const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [leadId])
    if (leadResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }
    
    const lead = leadResult.rows[0]
    
    // Buscar TODAS as propriedades do usuário (sem filtros)
    const allPropsResult = await client.query(`
      SELECT id, title, "propertyType", "rentPrice", "salePrice", status 
      FROM properties 
      WHERE "userId" = $1
    `, [lead.userId])
    
    console.log('📊 Todas as propriedades do usuário:', allPropsResult.rows)
    
    // Buscar propriedades que fazem match SEM verificar status
    const relaxedMatchResult = await client.query(`
      SELECT id, title, "propertyType", "rentPrice", "salePrice", status
      FROM properties 
      WHERE "userId" = $1 
        AND "propertyType" = $2
    `, [lead.userId, lead.propertyType])
    
    console.log('🔍 Match por tipo de propriedade:', relaxedMatchResult.rows)
    
    // Criar uma notificação de teste manualmente
    if (relaxedMatchResult.rows.length > 0) {
      const property = relaxedMatchResult.rows[0]
      const notificationId = 'test_notif_' + Date.now()
      
      try {
        const insertNotificationResult = await client.query(`
          INSERT INTO lead_notifications (
            id, "leadId", "propertyId", type, title, message, "isRead", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [
          notificationId,
          leadId,
          property.id,
          'PROPERTY_MATCH',
          'Teste de Match Manual',
          `Teste de notificação para verificar se o sistema funciona`,
          false
        ])
        
        console.log('✅ Notificação de teste criada:', insertNotificationResult.rows[0])
      } catch (notifError) {
        console.error('❌ Erro ao criar notificação de teste:', notifError)
      }
    }
    
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
      allProperties: allPropsResult.rows,
      typeMatches: relaxedMatchResult.rows
    })
    
  } catch (error) {
    console.error('❌ Erro no matching simples:', error)
    return NextResponse.json({
      error: 'Erro no matching simples',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
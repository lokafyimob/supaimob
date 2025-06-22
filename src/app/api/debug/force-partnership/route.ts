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
    
    console.log('🚀 FORÇANDO CRIAÇÃO DE PARTNERSHIP_NOTIFICATIONS')
    
    // Criar uma parceria de teste DIRETAMENTE na tabela
    const partnershipId = 'force_test_' + Date.now()
    
    const insertQuery = `
      INSERT INTO partnership_notifications (
        id, "fromUserId", "toUserId", "leadId", "propertyId",
        "fromUserName", "fromUserPhone", "fromUserEmail",
        "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
        viewed, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    `
    
    await client.query(insertQuery, [
      partnershipId,
      user.id,              // fromUserId (você)
      user.id,              // toUserId (você mesmo para teste)
      'test_lead_123',      // leadId (fictício)
      'test_property_123',  // propertyId (fictício)
      'Seu Nome',           // fromUserName
      '11999999999',        // fromUserPhone
      'seu@email.com',      // fromUserEmail
      'Lead Teste',         // leadName
      '11888888888',        // leadPhone
      'Apartamento Teste',  // propertyTitle
      150000,               // propertyPrice
      'RENT',               // matchType
      false                 // viewed
    ])
    
    console.log('✅ Partnership notification FORÇADA criada:', partnershipId)
    
    // Verificar se foi criada
    const checkQuery = `
      SELECT * FROM partnership_notifications 
      WHERE id = $1
    `
    const checkResult = await client.query(checkQuery, [partnershipId])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'Partnership notification FORÇADA criada com sucesso!',
      partnershipId,
      data: checkResult.rows[0]
    })
    
  } catch (error) {
    console.error('❌ Erro ao forçar partnership:', error)
    return NextResponse.json({
      error: 'Erro ao forçar partnership',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
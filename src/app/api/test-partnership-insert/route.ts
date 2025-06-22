import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTE SIMPLES - INSERIR NA TABELA partnership_notifications')
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    console.log('✅ Conectado ao banco')
    
    // 1. Verificar se a tabela existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'partnership_notifications'
      );
    `
    const tableExists = await client.query(tableExistsQuery)
    console.log('📋 Tabela partnership_notifications existe:', tableExists.rows[0].exists)
    
    if (!tableExists.rows[0].exists) {
      await client.end()
      return NextResponse.json({
        error: 'Tabela partnership_notifications NÃO EXISTE!',
        exists: false
      })
    }
    
    // 2. Ver estrutura da tabela
    const structureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'partnership_notifications'
      ORDER BY ordinal_position;
    `
    const structure = await client.query(structureQuery)
    console.log('📝 Estrutura da tabela:', structure.rows)
    
    // 3. Tentar inserir um registro de teste
    const testId = 'test_' + Date.now()
    const insertQuery = `
      INSERT INTO partnership_notifications (
        id, "fromUserId", "toUserId", "leadId", "propertyId",
        "fromUserName", "leadName", "propertyTitle", "propertyPrice", "matchType",
        viewed, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `
    
    const insertResult = await client.query(insertQuery, [
      testId,
      'test_user_1',
      'test_user_2', 
      'test_lead_123',
      'test_prop_456',
      'Usuario Teste',
      'Lead Teste ULTRAPHINK',
      'Propriedade Teste',
      50000,
      'RENT',
      false
    ])
    
    console.log('✅ INSERÇÃO REALIZADA:', insertResult.rows[0])
    
    // 4. Verificar se foi inserido
    const checkQuery = `SELECT COUNT(*) as total FROM partnership_notifications WHERE id = $1`
    const checkResult = await client.query(checkQuery, [testId])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'DADOS INSERIDOS COM SUCESSO NA TABELA partnership_notifications!',
      tableExists: true,
      structure: structure.rows,
      insertedData: insertResult.rows[0],
      totalRecords: checkResult.rows[0].total
    })
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error)
    return NextResponse.json({
      error: 'FALHA NO TESTE',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 })
  }
}
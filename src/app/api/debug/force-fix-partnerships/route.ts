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
    
    console.log('🔧 FORCE FIX: Forçando correção de propriedades...')
    
    // 1. Verificar propriedades atuais
    const checkQuery = `
      SELECT id, title, "acceptsPartnership", "acceptsFinancing"
      FROM properties 
      WHERE "userId" = $1
    `
    const checkResult = await client.query(checkQuery, [user.id])
    
    console.log(`📊 Propriedades ANTES da correção:`)
    checkResult.rows.forEach(prop => {
      console.log(`- ${prop.title}: parceria=${prop.acceptsPartnership}, financiamento=${prop.acceptsFinancing}`)
    })
    
    // 2. FORÇA atualização de TODAS as propriedades do usuário
    const forceFixQuery = `
      UPDATE properties 
      SET 
        "acceptsPartnership" = true,
        "acceptsFinancing" = true,
        "updatedAt" = NOW()
      WHERE "userId" = $1
    `
    const fixResult = await client.query(forceFixQuery, [user.id])
    
    console.log(`✅ FORÇA: ${fixResult.rowCount} propriedades atualizadas`)
    
    // 3. Verificar resultado
    const verifyResult = await client.query(checkQuery, [user.id])
    
    console.log(`📊 Propriedades DEPOIS da correção:`)
    verifyResult.rows.forEach(prop => {
      console.log(`- ${prop.title}: parceria=${prop.acceptsPartnership}, financiamento=${prop.acceptsFinancing}`)
    })
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'FORÇA: Todas as propriedades foram corrigidas',
      updatedProperties: fixResult.rowCount,
      properties: verifyResult.rows
    })
    
  } catch (error) {
    console.error('❌ Erro no FORCE FIX:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
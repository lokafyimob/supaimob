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
    
    console.log('🔧 ULTRAPHINK: Corrigindo propriedades para aceitar parcerias... v2')
    
    // 1. Verificar propriedades atuais
    const checkQuery = `
      SELECT id, title, "acceptsPartnership", "acceptsFinancing"
      FROM properties 
      WHERE "userId" = $1
    `
    const checkResult = await client.query(checkQuery, [user.id])
    
    console.log(`📊 Propriedades do usuário antes da correção:`)
    checkResult.rows.forEach(prop => {
      console.log(`- ${prop.title}: parceria=${prop.acceptsPartnership}, financiamento=${prop.acceptsFinancing}`)
    })
    
    // 2. Corrigir propriedades que têm acceptsPartnership = null/undefined
    const fixQuery = `
      UPDATE properties 
      SET 
        "acceptsPartnership" = COALESCE("acceptsPartnership", true),
        "acceptsFinancing" = COALESCE("acceptsFinancing", true),
        "updatedAt" = NOW()
      WHERE "userId" = $1
        AND ("acceptsPartnership" IS NULL OR "acceptsFinancing" IS NULL)
    `
    const fixResult = await client.query(fixQuery, [user.id])
    
    console.log(`✅ ${fixResult.rowCount} propriedades corrigidas`)
    
    // 3. Verificar resultado
    const verifyResult = await client.query(checkQuery, [user.id])
    
    console.log(`📊 Propriedades do usuário após correção:`)
    verifyResult.rows.forEach(prop => {
      console.log(`- ${prop.title}: parceria=${prop.acceptsPartnership}, financiamento=${prop.acceptsFinancing}`)
    })
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'Propriedades corrigidas com sucesso',
      correctedProperties: fixResult.rowCount,
      properties: verifyResult.rows
    })
    
  } catch (error) {
    console.error('❌ Erro ao corrigir propriedades:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
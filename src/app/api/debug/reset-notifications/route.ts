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
    
    // Resetar TODAS as notificações do usuário para sent = false
    const resetQuery = `
      UPDATE lead_notifications 
      SET sent = false, "sentAt" = NULL, "updatedAt" = NOW()
      WHERE "leadId" IN (
        SELECT id FROM leads WHERE "userId" = $1
      )
    `
    
    const result = await client.query(resetQuery, [user.id])
    
    await client.end()
    
    console.log(`🔄 ${result.rowCount} notificações resetadas para o usuário ${user.id}`)
    
    return NextResponse.json({
      success: true,
      message: `${result.rowCount} notificações resetadas para aparecer novamente!`,
      resetCount: result.rowCount
    })
    
  } catch (error) {
    console.error('❌ Erro ao resetar notificações:', error)
    return NextResponse.json({
      error: 'Erro ao resetar notificações',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
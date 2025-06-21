import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Deletar notificações de teste
    const deleteQuery = `
      DELETE FROM lead_notifications 
      WHERE id LIKE 'TEST_%' OR id LIKE 'test_%' OR id LIKE 'FORCE_%'
        AND "leadId" IN (
          SELECT id FROM leads WHERE "userId" = $1
        )
    `
    
    const result = await client.query(deleteQuery, [user.id])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: `${result.rowCount} notificações de teste removidas!`,
      deletedCount: result.rowCount
    })
    
  } catch (error) {
    console.error('❌ Erro ao limpar notificações de teste:', error)
    return NextResponse.json({
      error: 'Erro ao limpar notificações de teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
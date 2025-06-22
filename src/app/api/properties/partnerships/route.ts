import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

/**
 * Endpoint para buscar imóveis disponíveis para parceria
 * Retorna imóveis de outros usuários que aceitam parceria
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log(`🤝 Buscando imóveis para parceria (excluindo usuário: ${user.id})`)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Buscar imóveis que aceitam parceria (exceto do usuário logado)
    const propertiesQuery = `
      SELECT 
        p.*,
        u.name as ownerName,
        u.email as ownerEmail,
        u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" != $1 
        AND p."acceptsPartnership" = true
        AND p.status = 'AVAILABLE'
        AND (p."rentPrice" > 0 OR p."salePrice" > 0)
      ORDER BY p."createdAt" DESC
      LIMIT 100
    `
    
    const result = await client.query(propertiesQuery, [user.id])
    await client.end()
    
    console.log(`🏠 ${result.rows.length} imóveis encontrados para parceria`)
    
    return NextResponse.json(result.rows)
    
  } catch (error) {
    console.error('❌ Erro ao buscar imóveis para parceria:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar imóveis para parceria' },
      { status: 500 }
    )
  }
}
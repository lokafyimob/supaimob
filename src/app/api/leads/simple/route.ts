import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE LEADS TEST ===')
    
    const user = await requireAuth(request)
    console.log('User authenticated:', user.id)
    
    // Use raw SQL to avoid any Prisma issues
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Get user leads with raw SQL
    const query = `
      SELECT id, name, email, phone, interest, "propertyType", "maxPrice", status, "createdAt" 
      FROM leads 
      WHERE "userId" = $1 
      ORDER BY "createdAt" DESC
    `
    
    const result = await client.query(query, [user.id])
    await client.end()
    
    console.log('Raw SQL found leads:', result.rows.length)
    
    return NextResponse.json({
      success: true,
      leads: result.rows,
      count: result.rows.length,
      userId: user.id
    })
    
  } catch (error) {
    console.error('Simple leads test error:', error)
    return NextResponse.json({
      error: 'Simple test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
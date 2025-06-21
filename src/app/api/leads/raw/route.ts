import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RAW SQL LEAD CREATION TEST ===')
    
    const user = await requireAuth(request)
    const data = await request.json()
    
    console.log('User authenticated:', user.id)
    console.log('Request data:', data)
    
    // Get DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    
    // Use node-postgres directly
    const { Client } = require('pg')
    const client = new Client({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    try {
      await client.connect()
      console.log('✅ Database connected via raw client')
      
      // First, get user company
      const userQuery = 'SELECT "companyId" FROM users WHERE id = $1'
      const userResult = await client.query(userQuery, [user.id])
      
      if (!userResult.rows.length) {
        await client.end()
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      const companyId = userResult.rows[0].companyId
      console.log('✅ User company found:', companyId)
      
      if (!companyId) {
        await client.end()
        return NextResponse.json({ error: 'User has no company' }, { status: 400 })
      }
      
      // Generate a simple ID
      const leadId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      // Insert lead with raw SQL
      const insertQuery = `
        INSERT INTO leads (
          id, name, email, phone, interest, "propertyType", "maxPrice", 
          "preferredCities", "preferredStates", status, "companyId", "userId", 
          "needsFinancing", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING id, name, email
      `
      
      const values = [
        leadId,
        data.name || 'Test Lead',
        data.email || 'test@test.com', 
        data.phone || '11999999999',
        'RENT',
        'APARTMENT',
        1000.0,
        '[]',
        '[]',
        'ACTIVE',
        companyId,
        user.id,
        false
      ]
      
      console.log('Executing insert with values:', values)
      
      const result = await client.query(insertQuery, values)
      console.log('✅ Lead inserted successfully:', result.rows[0])
      
      await client.end()
      
      return NextResponse.json({
        success: true,
        method: 'raw_sql',
        lead: result.rows[0],
        message: 'Lead created successfully using raw SQL'
      }, { status: 201 })
      
    } catch (sqlError) {
      console.error('❌ SQL Error:', sqlError)
      await client.end()
      
      return NextResponse.json({
        error: 'SQL execution failed',
        details: sqlError instanceof Error ? sqlError.message : 'Unknown SQL error',
        code: sqlError instanceof Error && 'code' in sqlError ? (sqlError as any).code : 'unknown'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Raw SQL test failed:', error)
    return NextResponse.json({
      error: 'Raw SQL test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
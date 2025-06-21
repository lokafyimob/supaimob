import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    console.log('=== CHECKING LEADS IN DATABASE ===')
    console.log('User ID:', user.id)
    
    // Use raw SQL to check leads
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Check all leads in database
    const allLeadsQuery = 'SELECT id, name, email, "userId", "companyId", "createdAt" FROM leads ORDER BY "createdAt" DESC LIMIT 10'
    const allLeads = await client.query(allLeadsQuery)
    
    // Check leads for this user
    const userLeadsQuery = 'SELECT id, name, email, "userId", "companyId", "createdAt" FROM leads WHERE "userId" = $1 ORDER BY "createdAt" DESC'
    const userLeads = await client.query(userLeadsQuery, [user.id])
    
    // Check user info
    const userQuery = 'SELECT id, email, "companyId" FROM users WHERE id = $1'
    const userData = await client.query(userQuery, [user.id])
    
    await client.end()
    
    return NextResponse.json({
      currentUser: {
        id: user.id,
        userData: userData.rows[0]
      },
      totalLeadsInDatabase: allLeads.rows.length,
      allLeads: allLeads.rows,
      userLeadsCount: userLeads.rows.length,
      userLeads: userLeads.rows,
      message: userLeads.rows.length > 0 ? 'User has leads in database' : 'No leads found for user'
    })
    
  } catch (error) {
    console.error('Error checking leads:', error)
    return NextResponse.json({
      error: 'Failed to check leads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
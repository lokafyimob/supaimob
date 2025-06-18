import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not found' })
    }

    // Parse URL to check if it's Neon
    const url = new URL(dbUrl)
    const isNeon = url.hostname.includes('neon.tech')
    
    return NextResponse.json({
      provider: isNeon ? 'NEON' : 'OTHER',
      host: url.hostname,
      database: url.pathname.slice(1),
      url_masked: dbUrl.replace(/:[^:@]*@/, ':***@'),
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse DATABASE_URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
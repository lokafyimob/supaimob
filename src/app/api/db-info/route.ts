import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      return NextResponse.json({
        error: 'DATABASE_URL not found',
        env_vars: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || key.includes('DB')
        )
      })
    }
    
    // Parse URL to show provider info (without password)
    const url = new URL(dbUrl)
    const provider = url.protocol.replace(':', '')
    const host = url.hostname
    const database = url.pathname.slice(1)
    
    return NextResponse.json({
      provider,
      host,
      database,
      url_masked: dbUrl.replace(/:[^:@]*@/, ':***@')
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse DATABASE_URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
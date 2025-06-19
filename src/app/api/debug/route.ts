import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try to get owners count (will show the specific error)
    const count = await prisma.owner.count()
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      owners_count: count
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error && 'code' in error ? (error as { code: string }).code : 'unknown'
    })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export async function POST(request: NextRequest) {
  try {
    const result = await seedDatabase()
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      user: {
        id: result.id,
        email: result.email,
        name: result.name
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
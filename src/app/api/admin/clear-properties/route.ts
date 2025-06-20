import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // First check how many properties exist
    const count = await prisma.property.count()
    
    return NextResponse.json({
      success: true,
      message: `Found ${count} properties in database`,
      count
    })
  } catch (error) {
    console.error('Error counting properties:', error)
    return NextResponse.json(
      { error: 'Failed to count properties' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear all records from properties table using raw SQL for better compatibility
    await prisma.$executeRaw`DELETE FROM "Property"`
    
    // Reset auto-increment counter if using PostgreSQL
    try {
      await prisma.$executeRaw`ALTER SEQUENCE "Property_id_seq" RESTART WITH 1`
    } catch (e) {
      // Ignore sequence reset errors (might not exist or different DB)
      console.log('Sequence reset skipped:', e)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Properties table cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing properties table:', error)
    return NextResponse.json(
      { error: 'Failed to clear properties table: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
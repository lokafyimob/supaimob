import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    // Clear all records from properties table
    const result = await prisma.property.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `${result.count} properties deleted successfully`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error clearing properties table:', error)
    return NextResponse.json(
      { error: 'Failed to clear properties table' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
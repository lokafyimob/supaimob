import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // This is a temporary endpoint to fix database schema issues
    // Should be removed after migration is complete
    
    console.log('Starting database migration...')
    
    // Make companyId nullable in owners table
    await prisma.$executeRaw`ALTER TABLE owners ALTER COLUMN "companyId" DROP NOT NULL`
    console.log('✅ Made owners.companyId nullable')
    
    // Add missing columns if they don't exist
    await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'`
    console.log('✅ Added properties.images column')
    
    await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "amenities" TEXT DEFAULT '[]'`
    console.log('✅ Added properties.amenities column')
    
    // Test owner creation
    const testData = {
      name: 'Test Owner',
      email: 'test-migration@example.com',
      phone: '11999999999',
      document: '12345678901',
      address: 'Test Address',
      city: 'Test City',
      state: 'SP',
      zipCode: '12345678',
      companyId: null,
      userId: '1'
    }
    
    const testOwner = await prisma.owner.create({
      data: testData
    })
    console.log('✅ Test owner created:', testOwner.id)
    
    // Clean up test data
    await prisma.owner.delete({
      where: { id: testOwner.id }
    })
    console.log('✅ Test data cleaned up')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
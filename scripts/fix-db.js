const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=1"
    }
  }
})

async function fixDatabase() {
  try {
    console.log('Connecting to database...')
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Check if images column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'images'
    `
    
    if (result.length === 0) {
      console.log('Adding missing images column...')
      await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'`
      console.log('✅ Images column added')
    } else {
      console.log('✅ Images column already exists')
    }
    
    // Test creating an owner without includes
    console.log('Testing owner creation...')
    const testOwner = await prisma.owner.create({
      data: {
        name: 'Test Owner',
        email: 'test@example.com',
        phone: '11999999999',
        document: '12345678901',
        address: 'Test Address',
        city: 'Test City',
        state: 'SP',
        zipCode: '12345678',
        companyId: '1',
        userId: '1'
      }
    })
    
    console.log('✅ Owner creation test successful:', testOwner.id)
    
    // Clean up test data
    await prisma.owner.delete({
      where: { id: testOwner.id }
    })
    console.log('✅ Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabase()
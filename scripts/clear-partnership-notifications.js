const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=1"
    }
  }
})

async function clearPartnershipNotifications() {
  try {
    console.log('Connecting to database...')
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection successful')
    
    // Count existing partnership notifications
    const existingCount = await prisma.partnershipNotification.count()
    console.log(`📊 Found ${existingCount} existing partnership notifications`)
    
    if (existingCount === 0) {
      console.log('ℹ️  No partnership notifications to delete')
      return
    }
    
    // Delete all partnership notifications
    console.log('🗑️  Deleting all partnership notifications...')
    const deleteResult = await prisma.partnershipNotification.deleteMany()
    
    console.log(`✅ Successfully deleted ${deleteResult.count} partnership notifications`)
    
    // Verify deletion
    const remainingCount = await prisma.partnershipNotification.count()
    if (remainingCount === 0) {
      console.log('✅ Verification: All partnership notifications have been successfully cleared')
    } else {
      console.log(`⚠️  Warning: ${remainingCount} partnership notifications still remain`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

clearPartnershipNotifications()
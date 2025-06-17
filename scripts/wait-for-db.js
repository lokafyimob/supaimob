// Wait for database to be ready before starting the app
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function waitForDatabase() {
  console.log('🔄 Waiting for database...')
  
  let attempts = 0
  const maxAttempts = 30
  
  while (attempts < maxAttempts) {
    try {
      await prisma.$connect()
      console.log('✅ Database connected!')
      
      // Try to run migrations
      console.log('🔄 Running database migrations...')
      
      // Push schema to database
      const { spawn } = require('child_process')
      const pushDb = spawn('npx', ['prisma', 'db', 'push'], {
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      await new Promise((resolve, reject) => {
        pushDb.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Database schema updated!')
            resolve()
          } else {
            console.log('❌ Database push failed, but continuing...')
            resolve() // Continue anyway
          }
        })
        pushDb.on('error', reject)
      })
      
      break
    } catch (error) {
      attempts++
      console.log(`❌ Database not ready (attempt ${attempts}/${maxAttempts}):`, error.message)
      
      if (attempts >= maxAttempts) {
        console.error('💥 Database connection failed after maximum attempts')
        process.exit(1)
      }
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  await prisma.$disconnect()
}

waitForDatabase().catch(console.error)
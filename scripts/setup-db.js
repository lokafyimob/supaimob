// Setup database tables and admin user
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Try to create tables (db push)
    console.log('🔄 Creating tables...')
    
    // Check if tables exist by trying to count users
    let userCount = 0
    try {
      userCount = await prisma.user.count()
      console.log('✅ Tables exist, user count:', userCount)
    } catch (error) {
      console.log('❌ Tables might not exist:', error.message)
      console.log('🔄 You need to run: npx prisma db push')
      return
    }
    
    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (admin) {
      console.log('✅ Admin user already exists')
      return
    }
    
    // Create company first
    const company = await prisma.company.create({
      data: {
        name: 'CRM Imobiliário',
        tradeName: 'CRM Imobiliário Ltda',
        document: '12345678000199',
        email: 'contato@crm.com',
        phone: '(11) 99999-9999',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      }
    })
    console.log('✅ Company created:', company.id)
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: company.id,
        isActive: true
      }
    })
    
    console.log('✅ Admin user created:', adminUser.id)
    console.log('✅ Login: admin@crm.com / admin123')
    
  } catch (error) {
    console.error('❌ Setup error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
// Simple test script
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testOwnerCreation() {
  try {
    console.log('🔍 Testing owner creation...')
    
    // Get admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' },
      include: { company: true }
    })
    
    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }
    
    console.log('✅ Admin found:', admin.email, 'Company:', admin.companyId)
    
    // Create test owner
    const owner = await prisma.owner.create({
      data: {
        name: 'João da Silva',
        email: 'joao@teste.com',
        phone: '(11) 99999-9999',
        document: '12345678901',
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        companyId: admin.companyId,
        userId: admin.id
      }
    })
    
    console.log('✅ Owner created successfully:', owner.id, owner.name)
    
    // List all owners
    const owners = await prisma.owner.findMany()
    console.log('📊 Total owners:', owners.length)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testOwnerCreation()
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return existingAdmin
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

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)

    // Create admin user
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

    console.log('✅ Database seeded successfully')
    return adminUser
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}
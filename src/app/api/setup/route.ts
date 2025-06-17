import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up database and admin user...')
    
    // Test connection first
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        admin: { email: existingAdmin.email, name: existingAdmin.name }
      })
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
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      admin: { 
        id: adminUser.id,
        email: adminUser.email, 
        name: adminUser.name 
      },
      company: {
        id: company.id,
        name: company.name
      }
    })
    
  } catch (error) {
    console.error('❌ Setup error:', error)
    
    return NextResponse.json({
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
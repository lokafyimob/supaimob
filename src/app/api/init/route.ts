import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Inicializando banco de dados...')
    
    // Verificar se usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Sistema já inicializado',
        adminExists: true
      })
    }

    // Criar company demo
    const demoCompany = await prisma.company.upsert({
      where: { document: '11.222.333/0001-44' },
      update: {},
      create: {
        name: 'Imobiliária Demo Ltda',
        tradeName: 'Demo Imóveis',
        document: '11.222.333/0001-44',
        email: 'contato@demoimoveis.com',
        phone: '(11) 3333-4444',
        address: 'Av. Principal, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        subscription: 'PREMIUM'
      }
    })

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: demoCompany.id
      }
    })

    console.log('✅ Sistema inicializado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Sistema inicializado com sucesso',
      adminUser: {
        email: adminUser.email,
        name: adminUser.name
      },
      company: {
        name: demoCompany.name
      }
    })

  } catch (error) {
    console.error('❌ Erro na inicialização:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na inicialização do sistema',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// Endpoint GET para verificar status
export async function GET(_request: NextRequest) {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' },
      include: { company: true }
    })

    return NextResponse.json({
      initialized: !!adminUser,
      adminExists: !!adminUser,
      company: adminUser?.company?.name || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      initialized: false,
      error: error instanceof Error ? error.message : 'Erro de conexão'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
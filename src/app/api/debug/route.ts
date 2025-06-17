import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Verificando estado do banco...')
    
    // Verificar tabelas e dados
    const userCount = await prisma.user.count()
    const companyCount = await prisma.company.count()
    
    // Buscar usuário teste
    const testUser = await prisma.user.findUnique({
      where: { email: 'teste@crm.com' },
      include: { company: true }
    })
    
    // Testar senha se usuário existir
    let passwordTest = null
    if (testUser) {
      passwordTest = await bcrypt.compare('test123', testUser.password)
    }
    
    const debug = {
      timestamp: new Date().toISOString(),
      database: {
        userCount,
        companyCount,
        tablesAccessible: true
      },
      testUser: {
        exists: !!testUser,
        email: testUser?.email,
        name: testUser?.name,
        role: testUser?.role,
        isActive: testUser?.isActive,
        isBlocked: testUser?.isBlocked,
        companyId: testUser?.companyId,
        companyName: testUser?.company?.name,
        passwordValid: passwordTest
      }
    }
    
    return NextResponse.json(debug)
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json({
      error: 'Erro ao acessar banco',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Force creating test user...')
    
    // Forçar criação do usuário
    let company = await prisma.company.findFirst({
      where: { document: '11.222.333/0001-44' }
    })
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Imobiliária Demo',
          tradeName: 'Demo CRM',
          document: '11.222.333/0001-44',
          email: 'demo@crm.com',
          phone: '(11) 1234-5678',
          address: 'Rua Demo, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          active: true,
          subscription: 'PREMIUM'
        }
      })
    }
    
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    const user = await prisma.user.upsert({
      where: { email: 'teste@crm.com' },
      update: {
        password: hashedPassword,
        name: 'Usuário Teste',
        role: 'USER',
        companyId: company.id,
        isActive: true,
        isBlocked: false
      },
      create: {
        email: 'teste@crm.com',
        name: 'Usuário Teste',
        password: hashedPassword,
        role: 'USER',
        companyId: company.id,
        isActive: true,
        isBlocked: false
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Usuário criado/atualizado com sucesso',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating user:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao criar usuário',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
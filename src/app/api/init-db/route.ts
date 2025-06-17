import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Inicializando banco de dados...')
    
    // Verificar se já existe usuário
    const userCount = await prisma.user.count()
    
    if (userCount > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Banco já está inicializado',
        users: userCount 
      })
    }
    
    // Criar company padrão
    const company = await prisma.company.create({
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
    
    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'teste@crm.com',
        name: 'Usuário Teste',
        password: hashedPassword,
        role: 'USER',
        companyId: company.id,
        isActive: true,
        isBlocked: false
      }
    })
    
    console.log('✅ Banco inicializado com sucesso')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Banco inicializado com sucesso!',
      user: user.email,
      company: company.name 
    })
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao inicializar banco',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
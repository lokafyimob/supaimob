import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 🔒 PROTEÇÃO: Verificar se usuário está autenticado
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Acesso negado. Usuário deve estar logado para acessar esta API.' },
        { status: 401 }
      )
    }

    // 🔒 PROTEÇÃO: Só ADMIN pode listar todos os usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isBlocked: true,
        lastLogin: true,
        createdAt: true,
        // 🔒 SEGURANÇA: NÃO retornar senha
        // password: false - implícito por não estar no select
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 PROTEÇÃO: Verificar se usuário está autenticado para criar novos usuários
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Acesso negado. Faça login.' },
        { status: 401 }
      )
    }

    // 🔒 PROTEÇÃO: Só ADMIN pode criar novos usuários
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      )
    }

    const data = await request.json()
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10)
    
    let companyId = data.companyId

    // Criar nova empresa se necessário
    if (data.companyData) {
      const company = await prisma.company.create({
        data: {
          name: data.companyData.name,
          tradeName: data.companyData.tradeName,
          document: data.companyData.document,
          email: data.companyData.email,
          phone: data.companyData.phone,
          address: data.companyData.address,
          city: data.companyData.city,
          state: data.companyData.state,
          zipCode: data.companyData.zipCode
        }
      })
      companyId = company.id
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        companyId: companyId || null,
        isActive: data.isActive ?? true,
        isBlocked: data.isBlocked ?? false
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true
          }
        }
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
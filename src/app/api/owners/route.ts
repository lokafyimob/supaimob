import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const owners = await prisma.owner.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(owners)
  } catch (error) {
    console.error('Error fetching owners:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar proprietários', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.document) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, telefone e documento' },
        { status: 400 }
      )
    }
    
    const owner = await prisma.owner.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        companyId: user.companyId || null,
        userId: user.id,
        bankAccount: data.bankAccount ? {
          create: {
            bankName: data.bankAccount.bankName,
            accountType: data.bankAccount.accountType,
            agency: data.bankAccount.agency,
            account: data.bankAccount.account,
            pixKey: data.bankAccount.pixKey || null
          }
        } : undefined
      }
    })

    return NextResponse.json(owner, { status: 201 })
  } catch (error) {
    console.error('Error creating owner:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Handle database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email ou documento já está em uso' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Dados de usuário ou empresa inválidos' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar proprietário', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
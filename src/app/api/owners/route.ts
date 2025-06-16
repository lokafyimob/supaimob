import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const owners = await prisma.owner.findMany({
      where: {
        userId: user.id
      },
      include: {
        properties: true,
        bankAccount: true
      },
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
    
    const owner = await prisma.owner.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        companyId: user.companyId || '',
        userId: user.id,
        bankAccount: data.bankAccount ? {
          create: {
            bankName: data.bankAccount.bankName,
            accountType: data.bankAccount.accountType,
            agency: data.bankAccount.agency,
            account: data.bankAccount.account,
            pixKey: data.bankAccount.pixKey
          }
        } : undefined
      },
      include: {
        properties: true,
        bankAccount: true
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
    return NextResponse.json(
      { error: 'Erro ao criar proprietário', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
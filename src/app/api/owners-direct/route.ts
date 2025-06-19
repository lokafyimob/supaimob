import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest) {
  try {
    const owners = await prisma.owner.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      success: true,
      owners
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao buscar proprietários',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, document, address, city, state, zipCode } = body
    
    const owner = await prisma.owner.create({
      data: {
        name,
        email,
        phone,
        document,
        address,
        city,
        state,
        zipCode,
        userId: 'admin-123' // Default user
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Proprietário cadastrado com sucesso!',
      id: owner.id
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao cadastrar proprietário',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
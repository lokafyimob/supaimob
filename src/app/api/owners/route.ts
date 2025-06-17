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
  let user: any = null
  let data: any = null
  
  try {
    // Debug logs
    console.log('🔍 POST /api/owners - Starting...')
    
    user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email, companyId: user.companyId })
    
    data = await request.json()
    console.log('📝 Request data:', data)
    
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.document) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, telefone e documento' },
        { status: 400 }
      )
    }
    
    console.log('🚀 Creating owner...')
    
    const ownerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      companyId: user.companyId || null,
      userId: user.id
    }
    
    console.log('📊 Owner data to create:', ownerData)
    
    const owner = await prisma.owner.create({
      data: ownerData
    })

    console.log('✅ Owner created successfully:', owner.id)
    return NextResponse.json(owner, { status: 201 })
  } catch (error) {
    console.error('Error creating owner:', error)
    if (user) console.error('User data:', { id: user.id, companyId: user.companyId })
    if (data) console.error('Request data:', data)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Handle database constraint errors
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
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
      if (error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Tabela ou coluna não existe no banco de dados' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar proprietário', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Simple owner creation...')
    
    // Usar NextAuth session diretamente
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        error: 'Não autenticado',
        details: 'Session not found'
      }, { status: 401 })
    }
    
    console.log('✅ Session found:', session.user.email)
    
    // Buscar usuário completo
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true }
    })
    
    if (!user) {
      return NextResponse.json({
        error: 'Usuário não encontrado',
        details: 'User not in database'
      }, { status: 404 })
    }
    
    console.log('✅ User found:', { id: user.id, companyId: user.companyId })
    
    const data = await request.json()
    console.log('📝 Data received:', data)
    
    // Usar companyId do usuário ou criar um padrão
    const companyId = user.companyId || user.company?.id || 'default-company'
    
    console.log('🏢 Using companyId:', companyId)
    
    // Criar owner com dados mínimos
    const owner = await prisma.owner.create({
      data: {
        name: data.name || 'Nome Padrão',
        email: data.email || `owner-${Date.now()}@teste.com`,
        phone: data.phone || '(11) 99999-9999',
        document: data.document || `${Date.now()}`,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        companyId: companyId,
        userId: user.id
      }
    })
    
    console.log('✅ Owner created:', owner.id)
    
    return NextResponse.json({
      success: true,
      owner,
      message: 'Proprietário criado com sucesso via API simplificada'
    }, { status: 201 })
    
  } catch (error) {
    console.error('❌ Simple owner creation error:', error)
    
    return NextResponse.json({
      error: 'Erro na criação simplificada',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
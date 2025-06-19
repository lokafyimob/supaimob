import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing owner creation...')
    
    // Buscar usuário admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' },
      include: { company: true }
    })
    
    if (!adminUser) {
      return NextResponse.json({
        error: 'Admin user not found',
        details: 'Need to login first'
      }, { status: 404 })
    }
    
    console.log('✅ Admin user found:', adminUser.email)
    console.log('👤 User data:', {
      id: adminUser.id,
      companyId: adminUser.companyId,
      company: adminUser.company?.name
    })
    
    // Tentar criar proprietário de teste
    const testOwnerData = {
      name: 'João Silva Teste',
      email: 'joao.teste@email.com',
      phone: '(11) 99999-1234',
      document: '123.456.789-00',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    }
    
    console.log('📝 Creating owner with data:', testOwnerData)
    
    const owner = await prisma.owner.create({
      data: {
        name: testOwnerData.name,
        email: testOwnerData.email,
        phone: testOwnerData.phone,
        document: testOwnerData.document,
        address: testOwnerData.address,
        city: testOwnerData.city,
        state: testOwnerData.state,
        zipCode: testOwnerData.zipCode,
        companyId: adminUser.companyId,
        userId: adminUser.id
      }
    })
    
    console.log('✅ Owner created successfully:', owner.id)
    
    return NextResponse.json({
      success: true,
      message: 'Owner created successfully',
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        companyId: owner.companyId,
        userId: owner.userId
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        companyId: adminUser.companyId
      }
    })
    
  } catch (error) {
    console.error('❌ Error in test-owner:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create owner',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
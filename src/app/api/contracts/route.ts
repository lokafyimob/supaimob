import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(contracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar contratos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    // Get property to access companyId and verify ownership
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Verify that the property belongs to the current user
    if (property.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to property' }, { status: 403 })
    }

    // Verify that the tenant belongs to the current user
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId }
    })

    if (!tenant || tenant.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to tenant' }, { status: 403 })
    }

    const contract = await prisma.contract.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        companyId: property.companyId,
        userId: user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        administrationFeePercentage: data.administrationFeePercentage || 10.0,
        terms: data.terms || null,
        status: data.status || 'ACTIVE'
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      }
    })

    // 🚀 GERAR PAGAMENTOS AUTOMATICAMENTE
    if (contract.status === 'ACTIVE') {
      console.log('📅 Gerando pagamentos automaticamente para novo contrato:', contract.id)
      try {
        await generatePaymentsForContract(contract.id)
        console.log('✅ Pagamentos gerados com sucesso!')
      } catch (error) {
        console.error('❌ Erro ao gerar pagamentos:', error)
        // Não falhar a criação do contrato se a geração de pagamentos falhar
      }
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('Error creating contract:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar contrato', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
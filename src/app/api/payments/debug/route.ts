import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Verificar contratos do usuário
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id
      },
      include: {
        property: true,
        tenant: true,
        payments: true
      }
    })

    // Verificar todos os pagamentos (sem filtro de contrato ativo)
    const allPayments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: user.id
        }
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      contracts: contracts.map(c => ({
        id: c.id,
        status: c.status,
        property: c.property?.title,
        tenant: c.tenant?.name,
        paymentsCount: c.payments?.length || 0
      })),
      allPayments: allPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        dueDate: p.dueDate,
        contractStatus: p.contract.status,
        property: p.contract.property?.title,
        tenant: p.contract.tenant?.name
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
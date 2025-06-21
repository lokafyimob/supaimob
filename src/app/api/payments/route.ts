import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // Buscar pagamentos do mês atual relacionados aos contratos do usuário
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: user.id
        },
        dueDate: {
          gte: new Date(currentYear, currentMonth - 1, 1), // Primeiro dia do mês atual
          lt: new Date(currentYear, currentMonth, 1) // Primeiro dia do próximo mês
        }
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    console.log(`📊 Encontrados ${payments.length} pagamentos para o usuário ${user.email}`)
    payments.forEach(p => {
      console.log(`- ${p.id}: ${p.contract.tenant.name} - R$ ${p.amount} - ${p.status} - Penalty: R$ ${p.penalty || 0} - Interest: R$ ${p.interest || 0}`)
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { id, ...data } = await request.json()
    
    // Verificar se o pagamento pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        contract: {
          userId: user.id
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Atualizar o pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: data.paymentMethod,
        receipts: JSON.stringify(data.receipts || []),
        notes: data.notes
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

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
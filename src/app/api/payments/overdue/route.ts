import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { PaymentService } from '@/lib/payment-service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Usuário não está associado a uma empresa' },
        { status: 400 }
      )
    }

    const paymentService = new PaymentService()
    
    // Buscar pagamentos em atraso
    const overduePayments = await prisma.payment.findMany({
      where: {
        dueDate: {
          lt: new Date()
        },
        status: {
          in: ['PENDING', 'OVERDUE']
        },
        contract: {
          companyId: user.companyId
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
        dueDate: 'asc'
      }
    })

    // Calcular valores atualizados com multa e juros para cada pagamento
    const paymentsWithLateFees = await Promise.all(
      overduePayments.map(async (payment) => {
        try {
          const lateFeesResult = await paymentService.calculateLateFees(
            payment.amount,
            payment.dueDate.toISOString(),
            user.companyId!
          )

          return {
            ...payment,
            calculatedPenalty: lateFeesResult.penalty,
            calculatedInterest: lateFeesResult.interest,
            calculatedTotal: lateFeesResult.totalAmount,
            daysPastDue: lateFeesResult.daysPastDue,
            effectiveDaysForCharges: lateFeesResult.effectiveDaysForCharges,
            isInGracePeriod: lateFeesResult.effectiveDaysForCharges <= 0
          }
        } catch (error) {
          console.error(`Erro ao calcular multa/juros para pagamento ${payment.id}:`, error)
          return {
            ...payment,
            calculatedPenalty: payment.penalty || 0,
            calculatedInterest: payment.interest || 0,
            calculatedTotal: payment.amount + (payment.penalty || 0) + (payment.interest || 0),
            daysPastDue: Math.floor((new Date().getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
            effectiveDaysForCharges: 0,
            isInGracePeriod: true,
            calculationError: error instanceof Error ? error.message : 'Erro desconhecido'
          }
        }
      })
    )

    // Estatísticas
    const stats = {
      totalOverdue: paymentsWithLateFees.length,
      inGracePeriod: paymentsWithLateFees.filter(p => p.isInGracePeriod).length,
      withCharges: paymentsWithLateFees.filter(p => !p.isInGracePeriod).length,
      totalOriginalAmount: paymentsWithLateFees.reduce((sum, p) => sum + p.amount, 0),
      totalWithCharges: paymentsWithLateFees.reduce((sum, p) => sum + p.calculatedTotal, 0),
      totalPenalties: paymentsWithLateFees.reduce((sum, p) => sum + p.calculatedPenalty, 0),
      totalInterest: paymentsWithLateFees.reduce((sum, p) => sum + p.calculatedInterest, 0)
    }

    return NextResponse.json({
      payments: paymentsWithLateFees,
      stats
    })

  } catch (error) {
    console.error('Erro ao buscar pagamentos em atraso:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos em atraso', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { PaymentService } from '@/lib/payment-service'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Usuário não está associado a uma empresa' },
        { status: 400 }
      )
    }

    const paymentService = new PaymentService()
    
    // Buscar todos os pagamentos pendentes e em atraso da empresa
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE']
        },
        dueDate: {
          lt: new Date() // Vencimento anterior à data atual
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
      }
    })

    console.log(`Encontrados ${overduePayments.length} pagamentos em atraso`)

    const updatedPayments = []
    let processedCount = 0
    let errorCount = 0

    for (const payment of overduePayments) {
      try {
        // Calcular multa e juros considerando período de carência
        const lateFeesResult = await paymentService.calculateLateFees(
          payment.amount,
          payment.dueDate.toISOString(),
          user.companyId!
        )

        // Se há cobrança efetiva (passou do período de carência)
        if (lateFeesResult.effectiveDaysForCharges > 0) {
          // Atualizar o pagamento com multa e juros
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              penalty: lateFeesResult.penalty,
              interest: lateFeesResult.interest,
              status: 'OVERDUE'
            }
          })

          updatedPayments.push({
            id: payment.id,
            originalAmount: payment.amount,
            penalty: lateFeesResult.penalty,
            interest: lateFeesResult.interest,
            totalAmount: lateFeesResult.totalAmount,
            daysPastDue: lateFeesResult.daysPastDue,
            effectiveDaysForCharges: lateFeesResult.effectiveDaysForCharges,
            tenant: payment.contract.tenant.name,
            property: payment.contract.property.title
          })

          processedCount++
        } else {
          // Ainda no período de carência, apenas marca como overdue se necessário
          if (payment.status === 'PENDING') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'OVERDUE' }
            })
          }
        }
      } catch (error) {
        console.error(`Erro ao processar pagamento ${payment.id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processamento concluído: ${processedCount} pagamentos atualizados com multa/juros`,
      details: {
        totalFound: overduePayments.length,
        processed: processedCount,
        errors: errorCount,
        updatedPayments
      }
    })

  } catch (error) {
    console.error('Erro ao aplicar multas e juros:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao aplicar multas e juros', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
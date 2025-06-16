import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, paymentMethod, receipts, notes } = await request.json()
    
    console.log('=== DEBUG MARK-PAID SEM AUTH ===')
    console.log('Payment ID recebido:', paymentId)
    console.log('Payment Method:', paymentMethod)
    
    if (!paymentId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment ID e método de pagamento são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o pagamento existe (sem autenticação)
    const paymentExists = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })
    
    console.log('Pagamento existe?', !!paymentExists)
    
    if (!paymentExists) {
      console.log('❌ Pagamento não encontrado no banco')
      return NextResponse.json({ 
        error: 'Pagamento não encontrado no banco',
        paymentId
      }, { status: 404 })
    }

    console.log('✅ Pagamento encontrado:', {
      id: paymentExists.id,
      status: paymentExists.status,
      tenant: paymentExists.contract.tenant.name
    })

    if (paymentExists.status === 'PAID') {
      return NextResponse.json({ error: 'Pagamento já foi marcado como pago' }, { status: 400 })
    }

    // Atualizar o pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod,
        receipts: receipts ? JSON.stringify(receipts) : null,
        notes: notes || `Debug: Pagamento via ${paymentMethod} - ${new Date().toLocaleString('pt-BR')}`
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

    console.log('✅ Pagamento atualizado com sucesso!')

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Pagamento marcado como pago com sucesso (sem auth)'
    })

  } catch (error) {
    console.error('❌ Erro na API debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
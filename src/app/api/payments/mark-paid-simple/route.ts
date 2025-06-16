import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== SIMPLE MARK-PAID API ===')
    
    const { paymentId, paymentMethod, receipts, notes } = await request.json()
    
    console.log('Received data:', { paymentId, paymentMethod })
    
    // Import Prisma only when needed to avoid hanging
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      // Find payment
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      })
      
      if (!payment) {
        await prisma.$disconnect()
        return NextResponse.json({ 
          error: 'Pagamento não encontrado',
          paymentId
        }, { status: 404 })
      }
      
      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paidDate: new Date(),
          paymentMethod: paymentMethod,
          receipts: receipts ? JSON.stringify(receipts) : null,
          notes: notes || `Pagamento via ${paymentMethod} - ${new Date().toLocaleString('pt-BR')}`
        }
      })
      
      await prisma.$disconnect()
      
      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        message: 'Pagamento marcado como pago com sucesso'
      })
      
    } catch (dbError) {
      await prisma.$disconnect()
      throw dbError
    }
    
  } catch (error) {
    console.error('Error in simple mark-paid:', error)
    return NextResponse.json(
      { error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
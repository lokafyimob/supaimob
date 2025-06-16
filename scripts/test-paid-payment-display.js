const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPaidPaymentDisplay() {
  console.log('🧪 TESTANDO DISPLAY DE PAGAMENTO PAGO COM JUROS')
  
  // Buscar um pagamento OVERDUE para simular o processo
  const overduePayment = await prisma.payment.findFirst({
    where: { status: 'OVERDUE' },
    include: { contract: { include: { tenant: true } } }
  })
  
  if (!overduePayment) {
    console.log('❌ Nenhum pagamento OVERDUE encontrado')
    return
  }
  
  console.log('📋 ANTES - Pagamento OVERDUE:')
  console.log(`👤 Inquilino: ${overduePayment.contract.tenant.name}`)
  console.log(`💰 Amount: R$ ${overduePayment.amount}`)
  console.log(`📊 Status: ${overduePayment.status}`)
  console.log(`💸 Penalty: R$ ${overduePayment.penalty || 0}`)
  console.log(`💸 Interest: R$ ${overduePayment.interest || 0}`)
  
  // Calcular valores de multa e juros
  const dueDate = new Date(overduePayment.dueDate)
  const currentDate = new Date()
  const daysPastDue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const penalty = overduePayment.amount * (2.0 / 100)
  const interest = overduePayment.amount * (0.033 / 100) * daysPastDue
  const finalAmount = overduePayment.amount + penalty + interest
  
  console.log('')
  console.log('💰 SIMULANDO MARCAÇÃO COMO PAGO:')
  console.log(`Valor original: R$ ${overduePayment.amount}`)
  console.log(`Multa calculada: R$ ${penalty.toFixed(2)}`)
  console.log(`Juros calculados: R$ ${interest.toFixed(2)}`)
  console.log(`Valor final: R$ ${finalAmount.toFixed(2)}`)
  
  // Simular a atualização que seria feita pela API
  const updatedPayment = await prisma.payment.update({
    where: { id: overduePayment.id },
    data: {
      status: 'PAID',
      amount: Math.round(finalAmount * 100) / 100,
      penalty: Math.round(penalty * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      paidDate: new Date(),
      paymentMethod: 'PIX'
    }
  })
  
  console.log('')
  console.log('✅ DEPOIS - Pagamento PAID:')
  console.log(`👤 Inquilino: ${overduePayment.contract.tenant.name}`)
  console.log(`💰 Amount: R$ ${updatedPayment.amount}`)
  console.log(`📊 Status: ${updatedPayment.status}`)
  console.log(`💸 Penalty: R$ ${updatedPayment.penalty}`)
  console.log(`💸 Interest: R$ ${updatedPayment.interest}`)
  console.log(`💳 Payment Method: ${updatedPayment.paymentMethod}`)
  
  console.log('')
  console.log('🎯 RESULTADO: Na interface deve aparecer:')
  console.log(`- Valor principal: R$ ${updatedPayment.amount}`)
  console.log(`- Multa/Juros: R$ ${(updatedPayment.penalty + updatedPayment.interest).toFixed(2)}`)
  console.log(`- Status: PAGO com ícone verde`)
  
  console.log('')
  console.log('📋 DADOS PARA FRONTEND:')
  console.log(JSON.stringify({
    id: updatedPayment.id,
    amount: updatedPayment.amount,
    penalty: updatedPayment.penalty,
    interest: updatedPayment.interest,
    status: updatedPayment.status,
    paymentMethod: updatedPayment.paymentMethod
  }, null, 2))
}

testPaidPaymentDisplay().finally(() => prisma.$disconnect())
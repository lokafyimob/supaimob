const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPaymentCalculation() {
  console.log('🧪 TESTANDO CÁLCULO DE PAGAMENTO EM ATRASO')
  
  // Buscar um pagamento OVERDUE
  const overduePayment = await prisma.payment.findFirst({
    where: { status: 'OVERDUE' },
    include: { contract: { include: { tenant: true } } }
  })
  
  if (!overduePayment) {
    console.log('❌ Nenhum pagamento OVERDUE encontrado')
    return
  }
  
  const dueDate = new Date(overduePayment.dueDate)
  const currentDate = new Date()
  const daysPastDue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  
  console.log('📋 Pagamento encontrado:')
  console.log(`👤 Inquilino: ${overduePayment.contract.tenant.name}`)
  console.log(`📅 Vencimento: ${dueDate.toLocaleDateString('pt-BR')}`)
  console.log(`💰 Valor original: R$ ${overduePayment.amount}`)
  console.log(`⏰ Dias em atraso: ${daysPastDue}`)
  
  // Calcular multa e juros
  const penalty = overduePayment.amount * (2.0 / 100)
  const interest = overduePayment.amount * (0.033 / 100) * daysPastDue
  const total = overduePayment.amount + penalty + interest
  
  console.log('')
  console.log('💸 CÁLCULO DE MULTA E JUROS:')
  console.log(`Multa (2%): R$ ${penalty.toFixed(2)}`)
  console.log(`Juros (${daysPastDue} dias × 0.033%): R$ ${interest.toFixed(2)}`)
  console.log(`TOTAL: R$ ${total.toFixed(2)}`)
  console.log('')
  console.log('🎯 Este valor total deve aparecer quando marcar como pago!')
  
  return {
    paymentId: overduePayment.id,
    originalAmount: overduePayment.amount,
    penalty,
    interest,
    total,
    daysPastDue
  }
}

testPaymentCalculation().finally(() => prisma.$disconnect())
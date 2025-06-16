const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMarkPaidReal() {
  try {
    console.log('🧪 Testando marcar pagamento real como pago...')
    
    const paymentId = 'cmbyfo44b001vucln3mkcpw0t' // Pagamento 5 dias em atraso
    
    // Buscar o pagamento
    const payment = await prisma.payment.findUnique({
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
    
    if (!payment) {
      console.log('❌ Pagamento não encontrado')
      return
    }
    
    console.log('📋 ANTES:')
    console.log(`   ID: ${payment.id}`)
    console.log(`   Amount: R$ ${payment.amount}`)
    console.log(`   Status: ${payment.status}`)
    console.log(`   Penalty: R$ ${payment.penalty || 0}`)
    console.log(`   Interest: R$ ${payment.interest || 0}`)
    console.log(`   Tenant: ${payment.contract.tenant.name}`)
    
    // Calcular multa e juros (mesma lógica da API)
    const dueDate = new Date(payment.dueDate)
    const currentDate = new Date()
    const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    const paymentSettings = {
      penaltyRate: 2.0,
      dailyInterestRate: 0.033,
      gracePeriodDays: 0,
      maxInterestDays: 365
    }
    
    let finalAmount = payment.amount
    let penalty = 0
    let interest = 0
    
    if (daysPastDue > 0) {
      const effectiveDays = Math.max(0, daysPastDue - paymentSettings.gracePeriodDays)
      
      if (effectiveDays > 0) {
        penalty = payment.amount * (paymentSettings.penaltyRate / 100)
        const daysForInterest = Math.min(effectiveDays, paymentSettings.maxInterestDays)
        interest = payment.amount * (paymentSettings.dailyInterestRate / 100) * daysForInterest
        finalAmount = payment.amount + penalty + interest
      }
    }
    
    console.log(`\n📊 CÁLCULOS:`)
    console.log(`   Dias em atraso: ${daysPastDue}`)
    console.log(`   Valor original: R$ ${payment.amount}`)
    console.log(`   Multa: R$ ${penalty.toFixed(2)}`)
    console.log(`   Juros: R$ ${interest.toFixed(2)}`)
    console.log(`   Valor final: R$ ${finalAmount.toFixed(2)}`)
    
    // Atualizar o pagamento (mesma lógica da API)
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'PIX',
        amount: Math.round(finalAmount * 100) / 100,
        penalty: Math.round(penalty * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        notes: `Teste manual - ${new Date().toLocaleString('pt-BR')} - Multa: R$ ${penalty.toFixed(2)} - Juros: R$ ${interest.toFixed(2)}`
      }
    })
    
    console.log(`\n✅ DEPOIS:`)
    console.log(`   ID: ${updatedPayment.id}`)
    console.log(`   Amount: R$ ${updatedPayment.amount}`)
    console.log(`   Status: ${updatedPayment.status}`)
    console.log(`   Penalty: R$ ${updatedPayment.penalty}`)
    console.log(`   Interest: R$ ${updatedPayment.interest}`)
    console.log(`   Payment Method: ${updatedPayment.paymentMethod}`)
    console.log(`   Notes: ${updatedPayment.notes}`)
    
    console.log(`\n🎯 RESULTADO ESPERADO NO FRONTEND:`)
    console.log(`   Linha principal: R$ ${updatedPayment.amount}`)
    if ((updatedPayment.penalty || 0) > 0 || (updatedPayment.interest || 0) > 0) {
      const totalFees = (updatedPayment.penalty || 0) + (updatedPayment.interest || 0)
      console.log(`   + R$ ${totalFees.toFixed(2)} (multa/juros)`)
      console.log(`   Total: R$ ${updatedPayment.amount}`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMarkPaidReal()
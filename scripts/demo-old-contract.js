const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generatePaymentsForContract(contractId) {
  console.log('🔄 Gerando pagamentos automaticamente para contrato:', contractId)
  
  try {
    // Buscar o contrato
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { tenant: true }
    })
    
    if (!contract || contract.status !== 'ACTIVE') {
      console.log('❌ Contrato não encontrado ou não ativo')
      return
    }
    
    // Deletar pagamentos existentes deste contrato
    await prisma.payment.deleteMany({
      where: { contractId }
    })
    
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const dayOfMonth = startDate.getDate()
    
    console.log(`📝 ${contract.tenant.name}: Gerando pagamentos dia ${dayOfMonth}`)
    console.log(`📅 Período: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`)
    
    // Gerar pagamentos para todo o período do contrato
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    console.log(`📅 Mês atual: ${currentMonth + 1}/${currentYear}`)
    
    let paymentDate = new Date(startDate)
    paymentDate.setDate(dayOfMonth)
    
    // Ajustar para o primeiro dia de pagamento (mesmo mês ou próximo)
    if (paymentDate < startDate) {
      paymentDate.setMonth(paymentDate.getMonth() + 1)
    }
    
    const payments = []
    
    while (paymentDate <= endDate) {
      const paymentMonth = paymentDate.getMonth()
      const paymentYear = paymentDate.getFullYear()
      
      // 🎯 NOVA LÓGICA: Todos os meses anteriores ao mês atual = PAID
      // Mês atual e futuros = PENDING
      let status = 'PENDING'
      let paidDate = null
      
      if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
        // Meses anteriores ao atual = automaticamente PAID
        status = 'PAID'
        paidDate = new Date(paymentDate.getTime() - Math.random() * 10 * 86400000) // Pago de 1-10 dias antes do vencimento
        console.log(`  💰 ${paymentDate.toLocaleDateString('pt-BR')} - PAID (mês anterior ao atual)`)
      } else if (paymentYear === currentYear && paymentMonth === currentMonth) {
        // Mês atual: verificar se já venceu
        if (paymentDate < currentDate) {
          status = 'OVERDUE'
          console.log(`  ⚠️  ${paymentDate.toLocaleDateString('pt-BR')} - OVERDUE (mês atual, já vencido)`)
        } else {
          status = 'PENDING'
          console.log(`  ⏳ ${paymentDate.toLocaleDateString('pt-BR')} - PENDING (mês atual, ainda não vencido)`)
        }
      } else {
        // Meses futuros = PENDING
        status = 'PENDING'
        console.log(`  📅 ${paymentDate.toLocaleDateString('pt-BR')} - PENDING (mês futuro)`)
      }
      
      const payment = await prisma.payment.create({
        data: {
          contractId,
          amount: contract.rentAmount,
          dueDate: paymentDate,
          status,
          paidDate
        }
      })
      
      payments.push(payment)
      
      // Próximo mês
      paymentDate = new Date(paymentDate)
      paymentDate.setMonth(paymentDate.getMonth() + 1)
    }
    
    console.log(`🎉 ${payments.length} pagamentos gerados automaticamente!`)
    return payments
    
  } catch (error) {
    console.error('❌ Erro ao gerar pagamentos:', error)
    throw error
  }
}

// Demonstração prática
(async () => {
  try {
    console.log('🎭 DEMONSTRAÇÃO: CRIANDO CONTRATO ANTIGO')
    console.log('📅 Data atual: Junho 2025')
    console.log('')
    
    // Buscar um tenant e property existentes
    const tenant = await prisma.tenant.findFirst()
    const property = await prisma.property.findFirst()
    
    if (!tenant || !property) {
      console.log('❌ Precisamos de tenant e property para demo')
      return
    }
    
    console.log('🏠 Simulando contrato que começou em Janeiro 2024 (1.5 anos atrás)')
    console.log('🎯 EXPECTATIVA: Jan 2024 até Mai 2025 = PAID')
    console.log('🎯 EXPECTATIVA: Jun 2025 = OVERDUE (se já venceu) ou PENDING')
    console.log('🎯 EXPECTATIVA: Jul 2025+ = PENDING')
    console.log('')
    
    // Criar contrato antigo (começou em Janeiro 2024)
    const oldContract = await prisma.contract.create({
      data: {
        propertyId: property.id,
        tenantId: tenant.id,
        companyId: property.companyId,
        userId: property.userId,
        startDate: new Date('2024-01-15'), // Começou em Janeiro 2024
        endDate: new Date('2025-12-31'),   // Termina fim de 2025
        rentAmount: 1500,
        depositAmount: 1500,
        administrationFeePercentage: 10.0,
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ Contrato antigo criado:', oldContract.id)
    console.log('')
    
    // Gerar pagamentos automaticamente
    await generatePaymentsForContract(oldContract.id)
    
    // Mostrar resumo final
    console.log('')
    console.log('📊 RESUMO FINAL:')
    
    const allPayments = await prisma.payment.findMany({
      where: { contractId: oldContract.id },
      orderBy: { dueDate: 'asc' }
    })
    
    const summary = {
      paid: 0,
      pending: 0,
      overdue: 0
    }
    
    let totalPaidValue = 0
    let currentMonthPayment = null
    
    allPayments.forEach(p => {
      const date = new Date(p.dueDate)
      const month = date.getMonth()
      const year = date.getFullYear()
      const isCurrentMonth = month === 5 && year === 2025 // Junho
      
      if (p.status === 'PAID') {
        summary.paid++
        totalPaidValue += p.amount
      } else if (p.status === 'PENDING') {
        summary.pending++
      } else if (p.status === 'OVERDUE') {
        summary.overdue++
      }
      
      if (isCurrentMonth) {
        currentMonthPayment = p
      }
    })
    
    console.log(`💰 Pagamentos PAID: ${summary.paid} (R$ ${totalPaidValue})`)
    console.log(`⏳ Pagamentos PENDING: ${summary.pending}`)
    console.log(`⚠️  Pagamentos OVERDUE: ${summary.overdue}`)
    console.log('')
    console.log('🎯 RESULTADO: Você só precisa se preocupar com pagamentos do mês atual para frente!')
    console.log('🎯 Todos os meses passados já estão marcados como PAID automaticamente!')
    
    if (currentMonthPayment) {
      console.log('')
      console.log('📋 PAGAMENTO DO MÊS ATUAL (Junho):')
      console.log(`Status: ${currentMonthPayment.status}`)
      console.log(`Vencimento: ${new Date(currentMonthPayment.dueDate).toLocaleDateString('pt-BR')}`)
      console.log(`Valor: R$ ${currentMonthPayment.amount}`)
    }
    
  } catch (error) {
    console.error('❌ Erro na demonstração:', error)
  } finally {
    await prisma.$disconnect()
  }
})()
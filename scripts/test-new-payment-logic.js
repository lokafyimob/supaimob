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
    
    // Gerar pagamentos para todo o período do contrato
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
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

// Executar teste
(async () => {
  try {
    console.log('🧪 TESTANDO NOVA LÓGICA DE GERAÇÃO DE PAGAMENTOS')
    console.log('📅 Data atual:', new Date().toLocaleDateString('pt-BR'))
    console.log('📅 Mês atual: Junho 2025')
    console.log('')
    console.log('🎯 REGRA: Todos os meses anteriores a Junho = PAID')
    console.log('🎯 REGRA: Junho (mês atual) = PENDING ou OVERDUE se já venceu')
    console.log('🎯 REGRA: Meses futuros = PENDING')
    console.log('')
    
    await generatePaymentsForContract('cmbydstnq0001uczlua0et6rf')
    
    // Verificar resultado
    console.log('\n📊 VERIFICANDO RESULTADO:')
    const payments = await prisma.payment.findMany({
      where: { contractId: 'cmbydstnq0001uczlua0et6rf' },
      orderBy: { dueDate: 'asc' },
      include: { contract: { include: { tenant: true } } }
    })
    
    const stats = {
      paid: 0,
      pending: 0,
      overdue: 0
    }
    
    payments.forEach(p => {
      const date = new Date(p.dueDate)
      console.log(`${p.contract.tenant.name}: ${date.toLocaleDateString('pt-BR')} - ${p.status}`)
      stats[p.status.toLowerCase()]++
    })
    
    console.log('\n📈 ESTATÍSTICAS:')
    console.log(`💰 PAID: ${stats.paid}`)
    console.log(`⏳ PENDING: ${stats.pending}`) 
    console.log(`⚠️  OVERDUE: ${stats.overdue}`)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
})()
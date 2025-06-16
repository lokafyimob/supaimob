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
    const deletedCount = await prisma.payment.deleteMany({
      where: { contractId }
    })
    console.log(`🗑️ ${deletedCount.count} pagamentos antigos deletados`)
    
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const dayOfMonth = startDate.getDate()
    
    console.log(`📝 ${contract.tenant.name}: Gerando pagamentos dia ${dayOfMonth}`)
    console.log(`📅 Período: ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`)
    
    // Gerar pagamentos para todo o período do contrato
    const currentDate = new Date()
    let paymentDate = new Date(startDate)
    paymentDate.setDate(dayOfMonth)
    
    // Ajustar para o primeiro dia de pagamento (mesmo mês ou próximo)
    if (paymentDate < startDate) {
      paymentDate.setMonth(paymentDate.getMonth() + 1)
    }
    
    const payments = []
    
    while (paymentDate <= endDate) {
      const isOverdue = paymentDate < currentDate
      const isPastMonth = paymentDate.getMonth() < currentDate.getMonth() || paymentDate.getFullYear() < currentDate.getFullYear()
      
      let status = 'PENDING'
      if (isPastMonth) {
        status = 'PAID' // Meses anteriores como pagos
      } else if (isOverdue) {
        status = 'OVERDUE'
      }
      
      const payment = await prisma.payment.create({
        data: {
          contractId,
          amount: contract.rentAmount,
          dueDate: paymentDate,
          status,
          paidDate: status === 'PAID' ? new Date(paymentDate.getTime() - 86400000) : null // 1 dia antes
        }
      })
      
      payments.push(payment)
      console.log(`  ✅ ${paymentDate.toLocaleDateString('pt-BR')} (dia ${paymentDate.getDate()}) - R$ ${payment.amount} - ${status}`)
      
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

// Executar para o contrato existente
(async () => {
  try {
    await generatePaymentsForContract('cmbydstnq0001uczlua0et6rf')
    console.log('✅ Sistema automático testado com sucesso!')
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
})()
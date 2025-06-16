const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPaymentStatus() {
  console.log('🔄 CORRIGINDO STATUS DOS PAGAMENTOS')
  
  const currentDate = new Date()
  console.log('Data atual:', currentDate.toLocaleDateString('pt-BR'))
  
  // Buscar todos os pagamentos
  const payments = await prisma.payment.findMany({
    include: { contract: { include: { tenant: true } } }
  })
  
  for (const payment of payments) {
    const dueDate = new Date(payment.dueDate)
    const daysPastDue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    let newStatus = payment.status
    
    // Se não está pago, determinar se está em atraso ou pendente
    if (payment.status !== 'PAID') {
      if (daysPastDue > 0) {
        newStatus = 'OVERDUE'
      } else {
        newStatus = 'PENDING'
      }
    }
    
    if (newStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: newStatus }
      })
      console.log(`✅ ${payment.contract.tenant.name} - ${dueDate.toLocaleDateString('pt-BR')}: ${payment.status} → ${newStatus} (${daysPastDue} dias)`)
    }
  }
  
  console.log('🎉 Status dos pagamentos corrigidos!')
  
  // Mostrar resultado
  const overdueCount = await prisma.payment.count({ where: { status: 'OVERDUE' } })
  const pendingCount = await prisma.payment.count({ where: { status: 'PENDING' } })
  const paidCount = await prisma.payment.count({ where: { status: 'PAID' } })
  
  console.log(`📊 Resultado:`)
  console.log(`- PAID: ${paidCount}`)
  console.log(`- PENDING: ${pendingCount}`)  
  console.log(`- OVERDUE: ${overdueCount}`)
}

// Executar
fixPaymentStatus().finally(() => prisma.$disconnect())
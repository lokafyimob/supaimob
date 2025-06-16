const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function simulateFrontendLoad() {
  console.log('🧪 SIMULANDO CARREGAMENTO DO FRONTEND')
  
  // Simular a mesma query que a API faz
  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        // userId: user.id, // Vamos pular a verificação de usuário para teste
        status: 'ACTIVE'
      }
    },
    include: {
      contract: {
        include: {
          property: true,
          tenant: true
        }
      }
    },
    orderBy: {
      dueDate: 'desc'
    }
  })
  
  console.log(`📊 Total de pagamentos carregados: ${payments.length}`)
  
  // Filtrar pagamentos de junho (mês atual)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 5 (junho = mês 5)
  const currentYear = currentDate.getFullYear() // 2025
  
  console.log(`📅 Filtrando para mês atual: ${currentMonth + 1}/${currentYear}`)
  
  // Agrupar por inquilino (como faz o frontend)
  const paymentsByTenant = new Map()
  
  payments.forEach(payment => {
    const tenantKey = `${payment.contract.tenant.name}-${payment.contract.id}`
    
    if (!paymentsByTenant.has(tenantKey)) {
      paymentsByTenant.set(tenantKey, [])
    }
    paymentsByTenant.get(tenantKey).push(payment)
  })
  
  // Pegar apenas o pagamento do mês atual de cada inquilino
  const currentMonthPayments = []
  
  paymentsByTenant.forEach(tenantPaymentsList => {
    // Encontrar o pagamento do mês atual
    const currentMonthPayment = tenantPaymentsList.find((payment) => {
      const paymentDate = new Date(payment.dueDate)
      const paymentMonth = paymentDate.getMonth()
      const paymentYear = paymentDate.getFullYear()
      
      return paymentMonth === currentMonth && paymentYear === currentYear
    })
    
    if (currentMonthPayment) {
      currentMonthPayments.push(currentMonthPayment)
    }
  })
  
  console.log(`📋 Pagamentos do mês atual encontrados: ${currentMonthPayments.length}`)
  
  // Verificar se o pagamento com penalty está na lista
  const paymentWithPenalty = currentMonthPayments.find(p => p.id === 'cmbyf5l7w0011ucwqd768iaqu')
  
  if (paymentWithPenalty) {
    console.log('')
    console.log('✅ PAGAMENTO COM PENALTY ENCONTRADO:')
    console.log(`👤 Inquilino: ${paymentWithPenalty.contract.tenant.name}`)
    console.log(`💰 Amount: R$ ${paymentWithPenalty.amount}`)
    console.log(`💸 Penalty: R$ ${paymentWithPenalty.penalty || 0}`)
    console.log(`💸 Interest: R$ ${paymentWithPenalty.interest || 0}`)
    console.log(`📊 Status: ${paymentWithPenalty.status}`)
    console.log(`📅 Due Date: ${new Date(paymentWithPenalty.dueDate).toLocaleDateString('pt-BR')}`)
    
    // Simular a função calculateLateFees para PAID payment
    const penalty = paymentWithPenalty.penalty || 0
    const interest = paymentWithPenalty.interest || 0
    console.log('')
    console.log('🎨 SIMULANDO RENDERIZAÇÃO:')
    console.log(`Penalty: ${penalty}`)
    console.log(`Interest: ${interest}`)
    console.log(`Should show late fees? ${penalty > 0 || interest > 0}`)
    
    if (penalty > 0 || interest > 0) {
      console.log('✅ DEVE APARECER:')
      console.log(`- Valor principal: R$ ${paymentWithPenalty.amount}`)
      console.log(`- Multa/Juros: + R$ ${(penalty + interest).toFixed(2)} (multa/juros)`)
      console.log(`- Total: R$ ${paymentWithPenalty.amount}`)
    }
  } else {
    console.log('')
    console.log('❌ PAGAMENTO COM PENALTY NÃO ENCONTRADO NO MÊS ATUAL')
    console.log('Verificando todos os pagamentos de junho...')
    
    const junePayments = payments.filter(p => {
      const paymentDate = new Date(p.dueDate)
      return paymentDate.getMonth() === 5 && paymentDate.getFullYear() === 2025
    })
    
    console.log(`Pagamentos de junho: ${junePayments.length}`)
    junePayments.forEach(p => {
      console.log(`- ${p.contract.tenant.name}: ${new Date(p.dueDate).toLocaleDateString('pt-BR')} - R$ ${p.amount} - ${p.status} - Penalty: ${p.penalty || 0}`)
    })
  }
}

simulateFrontendLoad().finally(() => prisma.$disconnect())
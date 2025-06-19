const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugPartnerships() {
  console.log('🔍 Debugando dados de parceria...\n')
  
  // 1. Buscar todos os usuários e seus telefones
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      companyId: true
    }
  })
  
  console.log('👥 USUÁRIOS:')
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`)
    console.log(`    📞 Telefone: ${user.phone || 'NÃO DEFINIDO'}`)
    console.log(`    🏢 CompanyId: ${user.companyId || 'NÃO DEFINIDO'}`)
    console.log('')
  })
  
  // 2. Buscar empresas e telefones
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      phone: true
    }
  })
  
  console.log('🏢 EMPRESAS:')
  companies.forEach(company => {
    console.log(`  - ${company.name}`)
    console.log(`    📞 Telefone: ${company.phone}`)
    console.log('')
  })
  
  // 3. Buscar leads ativos e seus donos
  const leads = await prisma.lead.findMany({
    where: { status: 'ACTIVE' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyId: true
        }
      }
    }
  })
  
  console.log('📊 LEADS ATIVOS:')
  leads.forEach(lead => {
    console.log(`  - Lead: ${lead.name} (${lead.phone})`)
    console.log(`    👤 Dono: ${lead.user.name} (${lead.user.email})`)
    console.log(`    📞 Telefone do dono: ${lead.user.phone || 'NÃO DEFINIDO'}`)
    console.log(`    🏢 CompanyId do dono: ${lead.user.companyId || 'NÃO DEFINIDO'}`)
    console.log('')
  })
  
  // 4. Buscar notificações de parceria existentes
  const notifications = await prisma.partnershipNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  
  console.log('🤝 NOTIFICAÇÕES DE PARCERIA (últimas 10):')
  notifications.forEach(notification => {
    console.log(`  - De: ${notification.fromUserName} (${notification.fromUserEmail})`)
    console.log(`    📞 Telefone armazenado: ${notification.fromUserPhone || 'NÃO DEFINIDO'}`)
    console.log(`    📨 Para: userId ${notification.toUserId}`)
    console.log(`    🏠 Imóvel: ${notification.propertyTitle}`)
    console.log(`    👤 Lead: ${notification.leadName} (${notification.leadPhone})`)
    console.log(`    📅 Criado em: ${notification.createdAt.toISOString()}`)
    console.log('')
  })
  
  // 5. Verificar se há alguma inconsistência
  console.log('🔍 VERIFICANDO INCONSISTÊNCIAS...')
  
  for (const notification of notifications) {
    // Buscar o usuário que enviou a notificação
    const fromUser = await prisma.user.findUnique({
      where: { id: notification.fromUserId },
      select: { name: true, phone: true, companyId: true }
    })
    
    if (fromUser) {
      let actualPhone = fromUser.phone
      
      // Se não tem telefone, tentar buscar da empresa
      if (!actualPhone && fromUser.companyId) {
        const company = await prisma.company.findUnique({
          where: { id: fromUser.companyId },
          select: { phone: true }
        })
        actualPhone = company?.phone || null
      }
      
      if (actualPhone !== notification.fromUserPhone) {
        console.log(`❌ INCONSISTÊNCIA ENCONTRADA:`)
        console.log(`   Notificação: ${notification.fromUserName}`)
        console.log(`   Telefone na notificação: ${notification.fromUserPhone}`)
        console.log(`   Telefone real do usuário: ${actualPhone}`)
        console.log('')
      }
    }
  }
  
  console.log('✅ Debug concluído!')
}

debugPartnerships()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugSession() {
  console.log('🔍 Debugando sessões de usuário...\n')
  
  // Simular diferentes sessões de usuário
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  })
  
  for (const user of users) {
    console.log(`👤 USUÁRIO: ${user.name} (${user.email})`)
    console.log(`📞 Telefone próprio: ${user.phone || 'NÃO DEFINIDO'}`)
    
    // Buscar notificações de parceria que este usuário receberia
    const notifications = await prisma.partnershipNotification.findMany({
      where: {
        toUserId: user.id,
        viewed: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
    
    console.log(`🤝 Notificações de parceria (${notifications.length}):`)
    
    if (notifications.length === 0) {
      console.log('   Nenhuma notificação de parceria pendente')
    } else {
      notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. De: ${notification.fromUserName}`)
        console.log(`      📞 Telefone do corretor: ${notification.fromUserPhone}`)
        console.log(`      👤 Cliente: ${notification.leadName} (${notification.leadPhone})`)
        console.log(`      🏠 Imóvel: ${notification.propertyTitle}`)
        console.log('')
      })
    }
    
    console.log('---\n')
  }
  
  // Testar especificamente o usuário "ale@gmail.com" que pode estar vendo o bug
  const aleUser = await prisma.user.findUnique({
    where: { email: 'ale@gmail.com' },
    select: { id: true, name: true, email: true, phone: true }
  })
  
  if (aleUser) {
    console.log(`🎯 FOCO NO USUÁRIO ALE IMOVEIS:`)
    console.log(`📞 Telefone próprio: ${aleUser.phone || 'NÃO DEFINIDO'}`)
    
    const aleNotifications = await prisma.partnershipNotification.findMany({
      where: {
        toUserId: aleUser.id,
        viewed: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`🤝 Notificações recebidas: ${aleNotifications.length}`)
    aleNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. CORRETOR QUE TEM O CLIENTE: ${notification.fromUserName}`)
      console.log(`      📞 Telefone mostrado na notificação: ${notification.fromUserPhone}`)
      console.log(`      ❓ Este telefone deveria ser do corretor ${notification.fromUserName}, não do usuário logado`)
      console.log('')
    })
  }
}

debugSession()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugFinal() {
  console.log('🔍 DEBUG FINAL - Verificando se há telefone do usuário logado aparecendo incorretamente...\n')
  
  // Buscar todas as notificações de parceria e comparar os telefones
  const notifications = await prisma.partnershipNotification.findMany({
    include: {
      fromUser: {
        select: { id: true, name: true, phone: true, email: true }
      },
      toUser: {
        select: { id: true, name: true, phone: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`📊 Analisando ${notifications.length} notificações de parceria...\n`)
  
  let problemsFound = 0
  
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i]
    
    console.log(`--- NOTIFICAÇÃO ${i + 1} ---`)
    console.log(`👤 De (corretor com cliente): ${notification.fromUser.name} (${notification.fromUser.email})`)
    console.log(`   📞 Telefone real do corretor: ${notification.fromUser.phone || 'NÃO DEFINIDO'}`)
    console.log(`   📞 Telefone na notificação: ${notification.fromUserPhone || 'NÃO DEFINIDO'}`)
    
    console.log(`👤 Para (dono do imóvel): ${notification.toUser.name} (${notification.toUser.email})`)
    console.log(`   📞 Telefone do dono do imóvel: ${notification.toUser.phone || 'NÃO DEFINIDO'}`)
    
    // Verificar se o telefone na notificação é diferente do telefone real do corretor
    if (notification.fromUserPhone !== notification.fromUser.phone) {
      console.log(`❌ PROBLEMA: Telefone na notificação não confere com o telefone real do corretor!`)
      problemsFound++
    }
    
    // Verificar se o telefone na notificação é igual ao telefone do usuário que recebe
    if (notification.fromUserPhone === notification.toUser.phone) {
      console.log(`❌ PROBLEMA GRAVE: Telefone na notificação é igual ao telefone do usuário logado!`)
      console.log(`   Isso significa que está mostrando o telefone errado!`)
      problemsFound++
    }
    
    if (notification.fromUserPhone === notification.fromUser.phone) {
      console.log(`✅ OK: Telefone na notificação confere com o telefone do corretor`)
    }
    
    console.log('')
  }
  
  if (problemsFound === 0) {
    console.log('🎉 NENHUM PROBLEMA ENCONTRADO!')
    console.log('Os telefones estão sendo exibidos corretamente.')
    console.log('')
    console.log('🤔 Se você está vendo o telefone errado, pode ser:')
    console.log('1. Um problema de cache do navegador')
    console.log('2. Dados antigos sendo exibidos')
    console.log('3. Confusão na interpretação (o telefone mostrado DEVE ser do corretor que tem o cliente)')
    console.log('4. Um problema específico de uma situação que não está nos dados atuais')
  } else {
    console.log(`❌ ${problemsFound} PROBLEMAS ENCONTRADOS!`)
  }
  
  console.log('\n🔍 RESUMO DOS DADOS CORRETOS:')
  console.log('Na notificação de parceria:')
  console.log('- "Contato do Corretor:" deve mostrar o CORRETOR que TEM o cliente interessado')
  console.log('- O telefone mostrado deve ser do CORRETOR que tem o cliente (fromUser)')
  console.log('- NÃO deve ser o telefone do usuário logado (toUser)')
  console.log('')
  console.log('Exemplo: Se você é ALE IMOVEIS e BS IMOVEIS tem um cliente interessado no seu imóvel,')
  console.log('a notificação deve mostrar o telefone de BS IMOVEIS, não o seu telefone.')
}

debugFinal()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
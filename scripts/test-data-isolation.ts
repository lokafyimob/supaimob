import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDataIsolation() {
  console.log('🧪 Testando isolamento de dados por usuário...')

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })

  console.log('\n👥 Usuários no sistema:')
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`)
  })

  for (const user of users) {
    console.log(`\n📊 Dados do usuário: ${user.name}`)
    
    // Propriedades
    const properties = await prisma.property.findMany({
      where: { userId: user.id },
      select: { id: true, title: true }
    })
    console.log(`  🏠 Propriedades (${properties.length}):`)
    properties.forEach(prop => console.log(`    - ${prop.title}`))

    // Proprietários
    const owners = await prisma.owner.findMany({
      where: { userId: user.id },
      select: { id: true, name: true }
    })
    console.log(`  👤 Proprietários (${owners.length}):`)
    owners.forEach(owner => console.log(`    - ${owner.name}`))

    // Inquilinos
    const tenants = await prisma.tenant.findMany({
      where: { userId: user.id },
      select: { id: true, name: true }
    })
    console.log(`  🏘️ Inquilinos (${tenants.length}):`)
    tenants.forEach(tenant => console.log(`    - ${tenant.name}`))

    // Contratos
    const contracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true, rentAmount: true }
    })
    console.log(`  📄 Contratos (${contracts.length}):`)
    contracts.forEach(contract => console.log(`    - Valor: R$ ${contract.rentAmount}`))
  }

  console.log('\n✅ Teste de isolamento de dados concluído!')
}

testDataIsolation()
  .catch((e) => {
    console.error('❌ Erro no teste:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
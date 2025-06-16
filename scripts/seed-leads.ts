import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLeads() {
  console.log('🌱 Criando leads de exemplo...')

  // Buscar usuário admin
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@crm.com' },
    include: { company: true }
  })

  if (!adminUser || !adminUser.company) {
    console.error('❌ Usuário admin ou company não encontrado')
    return
  }

  // Lead 1 - Cliente procurando apartamento para alugar
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Roberto Silva',
      email: 'roberto.silva@email.com',
      phone: '(11) 99999-5555',
      document: '444.555.666-77',
      interest: 'RENT',
      propertyType: 'APARTMENT',
      minPrice: 2000.00,
      maxPrice: 3500.00,
      minBedrooms: 2,
      maxBedrooms: 3,
      minBathrooms: 1,
      maxBathrooms: 2,
      minArea: 60.0,
      maxArea: 100.0,
      preferredCities: JSON.stringify(['São Paulo', 'Osasco']),
      preferredStates: JSON.stringify(['SP']),
      amenities: JSON.stringify(['Piscina', 'Academia', 'Portaria 24h']),
      notes: 'Cliente procura apartamento próximo ao metrô. Trabalha na região central.',
      status: 'ACTIVE',
      companyId: adminUser.companyId!,
      userId: adminUser.id
    }
  })

  // Lead 2 - Cliente procurando casa para comprar
  const lead2 = await prisma.lead.create({
    data: {
      name: 'Fernanda Costa',
      email: 'fernanda.costa@email.com',
      phone: '(11) 88888-6666',
      document: '555.666.777-88',
      interest: 'BUY',
      propertyType: 'HOUSE',
      minPrice: 300000.00,
      maxPrice: 500000.00,
      minBedrooms: 3,
      maxBedrooms: 4,
      minBathrooms: 2,
      maxBathrooms: 3,
      minArea: 120.0,
      maxArea: 200.0,
      preferredCities: JSON.stringify(['São Paulo', 'Guarulhos', 'São Caetano do Sul']),
      preferredStates: JSON.stringify(['SP']),
      amenities: JSON.stringify(['Quintal', 'Garagem', 'Churrasqueira']),
      notes: 'Família com 2 filhos, precisa de quintal e boa localização para escolas.',
      status: 'ACTIVE',
      companyId: adminUser.companyId!,
      userId: adminUser.id,
      lastContactDate: new Date('2024-12-01')
    }
  })

  // Lead 3 - Cliente procurando sala comercial
  const lead3 = await prisma.lead.create({
    data: {
      name: 'Tech Startup Ltda',
      email: 'contato@techstartup.com',
      phone: '(11) 77777-9999',
      document: '22.333.444/0001-55',
      interest: 'RENT',
      propertyType: 'COMMERCIAL',
      minPrice: 1500.00,
      maxPrice: 3000.00,
      minBedrooms: 0,
      maxBedrooms: 0,
      minBathrooms: 1,
      maxBathrooms: 2,
      minArea: 40.0,
      maxArea: 80.0,
      preferredCities: JSON.stringify(['São Paulo']),
      preferredStates: JSON.stringify(['SP']),
      amenities: JSON.stringify(['Ar condicionado', 'Estacionamento', 'Internet']),
      notes: 'Startup de tecnologia precisa de espaço moderno, próximo ao transporte público.',
      status: 'ACTIVE',
      companyId: adminUser.companyId!,
      userId: adminUser.id
    }
  })

  // Lead 4 - Cliente convertido (exemplo)
  const lead4 = await prisma.lead.create({
    data: {
      name: 'Paulo Mendes',
      email: 'paulo.mendes@email.com',
      phone: '(11) 66666-8888',
      document: '666.777.888-99',
      interest: 'RENT',
      propertyType: 'STUDIO',
      minPrice: 1200.00,
      maxPrice: 2000.00,
      minBedrooms: 1,
      maxBedrooms: 1,
      minBathrooms: 1,
      maxBathrooms: 1,
      minArea: 25.0,
      maxArea: 45.0,
      preferredCities: JSON.stringify(['São Paulo']),
      preferredStates: JSON.stringify(['SP']),
      amenities: JSON.stringify(['Mobiliado', 'Internet']),
      notes: 'Jovem profissional, primeiro apartamento. Cliente já fechou contrato.',
      status: 'CONVERTED',
      companyId: adminUser.companyId!,
      userId: adminUser.id,
      lastContactDate: new Date('2024-11-15')
    }
  })

  console.log('✅ Leads criados:')
  console.log(`- ${lead1.name} (${lead1.interest})`)
  console.log(`- ${lead2.name} (${lead2.interest})`)
  console.log(`- ${lead3.name} (${lead3.interest})`)
  console.log(`- ${lead4.name} (${lead4.status})`)
  console.log('🎉 Seed de leads concluído!')
}

seedLeads()
  .catch((e) => {
    console.error('❌ Erro ao criar leads:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...')

  // Buscar company demo
  const demoCompany = await prisma.company.findFirst({
    where: { document: '11.222.333/0001-44' }
  })

  if (!demoCompany) {
    console.error('❌ Company demo não encontrada')
    return
  }

  // Criar usuário de teste
  const hashedPassword = await bcrypt.hash('test123', 10)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'teste@crm.com' },
    update: {},
    create: {
      email: 'teste@crm.com',
      name: 'Usuário Teste',
      password: hashedPassword,
      role: 'USER',
      companyId: demoCompany.id
    }
  })

  console.log('✅ Usuário teste criado:', testUser.email)

  // Criar proprietário para o usuário teste
  const testOwner = await prisma.owner.create({
    data: {
      name: 'Pedro Teste Santos',
      email: 'pedro.teste@email.com',
      phone: '(11) 99999-3333',
      document: '333.444.555-66',
      address: 'Rua do Teste, 300',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-999',
      companyId: demoCompany.id,
      userId: testUser.id
    }
  })

  // Criar inquilino para o usuário teste
  const testTenant = await prisma.tenant.create({
    data: {
      name: 'Maria Teste Costa',
      email: 'maria.teste@email.com',
      phone: '(11) 88888-4444',
      document: '777.888.999-00',
      address: 'Av. do Teste, 400',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-888',
      income: 6000.00,
      companyId: demoCompany.id,
      userId: testUser.id
    }
  })

  // Criar imóvel para o usuário teste
  const testProperty = await prisma.property.create({
    data: {
      title: 'Apartamento Teste Vila Olímpia',
      description: 'Apartamento de teste para validação do sistema',
      address: 'Rua do Teste, 123, Apto 45',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-999',
      bedrooms: 2,
      bathrooms: 1,
      area: 65.0,
      rentPrice: 2000.00,
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      ownerId: testOwner.id,
      companyId: demoCompany.id,
      userId: testUser.id,
      images: JSON.stringify([]),
      amenities: JSON.stringify(['Elevador', 'Portaria'])
    }
  })

  console.log('✅ Dados do usuário teste criados')
  console.log('📧 Email: teste@crm.com')
  console.log('🔑 Senha: test123')
  console.log('🎉 Usuário teste configurado com sucesso!')
}

createTestUser()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário teste:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar company demo
  const demoCompany = await prisma.company.upsert({
    where: { document: '11.222.333/0001-44' },
    update: {},
    create: {
      name: 'Imobiliária Demo Ltda',
      tradeName: 'Demo Imóveis',
      document: '11.222.333/0001-44',
      email: 'contato@demoimoveis.com',
      phone: '(11) 3333-4444',
      address: 'Av. Principal, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      subscription: 'PREMIUM'
    }
  })

  console.log('✅ Company criada:', demoCompany.name)

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: demoCompany.id
    }
  })

  console.log('✅ Usuário admin criado:', adminUser.email)

  // Criar proprietários
  const owner1 = await prisma.owner.create({
    data: {
      name: 'Maria Silva Santos',
      email: 'maria.santos@email.com',
      phone: '(11) 99999-1111',
      document: '123.456.789-00',
      address: 'Rua dos Proprietários, 100',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      companyId: demoCompany.id,
      userId: adminUser.id,
      bankAccount: {
        create: {
          bankName: 'Banco do Brasil',
          accountType: 'Conta Corrente',
          agency: '1234',
          account: '12345-6',
          pixKey: 'maria.santos@email.com'
        }
      }
    }
  })

  const owner2 = await prisma.owner.create({
    data: {
      name: 'João Carlos Oliveira',
      email: 'joao.oliveira@email.com',
      phone: '(11) 99999-2222',
      document: '987.654.321-00',
      address: 'Av. dos Investidores, 200',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890',
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  console.log('✅ Proprietários criados')

  // Criar inquilinos
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Ana Paula Costa',
      email: 'ana.costa@email.com',
      phone: '(11) 88888-1111',
      document: '111.222.333-44',
      address: 'Rua dos Inquilinos, 10',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-123',
      income: 8000.00,
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Carlos Eduardo Lima',
      email: 'carlos.lima@email.com',
      phone: '(11) 88888-2222',
      document: '555.666.777-88',
      address: 'Av. dos Locatários, 20',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-456',
      income: 12000.00,
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Empresa Tech Solutions Ltda',
      email: 'contato@techsolutions.com',
      phone: '(11) 88888-3333',
      document: '12.345.678/0001-90',
      address: 'Rua das Empresas, 500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-789',
      income: 50000.00,
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  console.log('✅ Inquilinos criados')

  // Criar imóveis
  const property1 = await prisma.property.create({
    data: {
      title: 'Apartamento Luxo Centro',
      description: 'Apartamento moderno de 3 quartos no centro da cidade com vista panorâmica',
      address: 'Rua Principal, 123, Apto 1502',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      bedrooms: 3,
      bathrooms: 2,
      area: 85.5,
      rentPrice: 2800.00,
      salePrice: 450000.00,
      propertyType: 'APARTMENT',
      status: 'RENTED',
      ownerId: owner1.id,
      companyId: demoCompany.id,
      userId: adminUser.id,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1560448204-e4c3ba6165a0?w=800',
        'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800'
      ]),
      amenities: JSON.stringify(['Piscina', 'Academia', 'Portaria 24h', 'Playground', 'Churrasqueira'])
    }
  })

  const property2 = await prisma.property.create({
    data: {
      title: 'Casa Familiar Jardim América',
      description: 'Casa ampla com quintal e garagem para 2 carros',
      address: 'Rua das Flores, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890',
      bedrooms: 4,
      bathrooms: 3,
      area: 180.0,
      rentPrice: 3500.00,
      propertyType: 'HOUSE',
      status: 'AVAILABLE',
      ownerId: owner1.id,
      companyId: demoCompany.id,
      userId: adminUser.id,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
      ]),
      amenities: JSON.stringify(['Quintal', 'Garagem', 'Churrasqueira', 'Lavabo'])
    }
  })

  const property3 = await prisma.property.create({
    data: {
      title: 'Sala Comercial Shopping Center',
      description: 'Sala comercial em shopping de alto padrão',
      address: 'Av. Comercial, 789, Sala 205',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-456',
      bedrooms: 0,
      bathrooms: 1,
      area: 45.0,
      rentPrice: 2200.00,
      propertyType: 'COMMERCIAL',
      status: 'RENTED',
      ownerId: owner2.id,
      companyId: demoCompany.id,
      userId: adminUser.id,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
      ]),
      amenities: JSON.stringify(['Ar condicionado', 'Estacionamento', 'Segurança'])
    }
  })

  const property4 = await prisma.property.create({
    data: {
      title: 'Studio Moderno Vila Madalena',
      description: 'Studio compacto e moderno em região nobre',
      address: 'Rua Harmonia, 321',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-111',
      bedrooms: 1,
      bathrooms: 1,
      area: 35.0,
      rentPrice: 1800.00,
      propertyType: 'STUDIO',
      status: 'MAINTENANCE',
      ownerId: owner2.id,
      companyId: demoCompany.id,
      userId: adminUser.id,
      images: JSON.stringify([]),
      amenities: JSON.stringify(['Mobiliado', 'Internet'])
    }
  })

  console.log('✅ Imóveis criados')

  // Criar contratos
  const contract1 = await prisma.contract.create({
    data: {
      propertyId: property1.id,
      tenantId: tenant1.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      rentAmount: 2800.00,
      depositAmount: 2800.00,
      status: 'ACTIVE',
      terms: 'Contrato de locação residencial conforme Lei 8.245/91. Reajuste anual pelo IGPM.',
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  const contract2 = await prisma.contract.create({
    data: {
      propertyId: property3.id,
      tenantId: tenant3.id,
      startDate: new Date('2023-12-01'),
      endDate: new Date('2025-11-30'),
      rentAmount: 2200.00,
      depositAmount: 4400.00,
      status: 'ACTIVE',
      terms: 'Contrato de locação comercial. Reajuste anual pelo IPCA.',
      companyId: demoCompany.id,
      userId: adminUser.id
    }
  })

  console.log('✅ Contratos criados')

  // Criar pagamentos
  const currentDate = new Date()
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
  
  // Pagamentos do contrato 1
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(startOfYear)
    dueDate.setMonth(i)
    dueDate.setDate(10)
    
    const isPaid = i < 2 // Primeiros 2 meses pagos
    
    await prisma.payment.create({
      data: {
        contractId: contract1.id,
        amount: 2800.00,
        dueDate: dueDate,
        paidDate: isPaid ? new Date(dueDate.getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000)) : null,
        status: isPaid ? 'PAID' : 'PENDING',
        boletoCode: `280012345678901234567890123456789012345${i.toString().padStart(2, '0')}`
      }
    })
  }

  // Pagamentos do contrato 2  
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(startOfYear)
    dueDate.setMonth(i)
    dueDate.setDate(5)
    
    const isPaid = i < 2
    
    await prisma.payment.create({
      data: {
        contractId: contract2.id,
        amount: 2200.00,
        dueDate: dueDate,
        paidDate: isPaid ? new Date(dueDate.getTime() + (Math.random() * 3 * 24 * 60 * 60 * 1000)) : null,
        status: isPaid ? 'PAID' : 'PENDING',
        boletoCode: `220012345678901234567890123456789012345${i.toString().padStart(2, '0')}`
      }
    })
  }

  console.log('✅ Pagamentos criados')

  // Criar alguns alertas
  await prisma.alert.create({
    data: {
      type: 'PAYMENT_DUE',
      message: 'Pagamento de R$ 2.800,00 vence em 3 dias - Ana Paula Costa',
      recipient: 'ana.costa@email.com'
    }
  })

  await prisma.alert.create({
    data: {
      type: 'CONTRACT_EXPIRING',
      message: 'Contrato do Apartamento Luxo Centro vence em 60 dias',
      recipient: 'maria.santos@email.com'
    }
  })

  console.log('✅ Alertas criados')
  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initProduction() {
  console.log('🚀 Inicializando produção...');
  
  try {
    // Verificar se usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe');
      return;
    }

    // Criar company demo se não existir
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
    });

    // Criar usuário admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@crm.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        companyId: demoCompany.id
      }
    });

    console.log('✅ Usuário admin criado:', adminUser.email);
    console.log('🎉 Inicialização concluída!');
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initProduction()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initProduction };
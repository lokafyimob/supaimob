const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...');
    
    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Found ${users.length} users`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    // Check payments
    const payments = await prisma.payment.findMany({
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    });
    console.log(`💰 Found ${payments.length} payments`);
    payments.forEach(payment => {
      console.log(`  - ${payment.id}: ${payment.status} - R$ ${payment.amount} (${payment.contract.tenant.name})`);
    });
    
    // Check contracts
    const contracts = await prisma.contract.findMany({
      include: {
        property: true,
        tenant: true
      }
    });
    console.log(`📋 Found ${contracts.length} contracts`);
    contracts.forEach(contract => {
      console.log(`  - ${contract.id}: ${contract.status} - ${contract.tenant.name} @ ${contract.property.title}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
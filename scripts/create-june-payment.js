const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createJunePayment() {
  try {
    // Find the contract
    const contract = await prisma.contract.findFirst({
      include: { tenant: true }
    })
    
    if (!contract) {
      console.log('❌ No contract found')
      return
    }
    
    console.log('📝 Found contract for:', contract.tenant.name)
    
    // Delete the May 31st payment and create a proper June payment
    const deleted = await prisma.payment.deleteMany({
      where: {
        contractId: contract.id,
        dueDate: new Date('2025-05-31')
      }
    })
    console.log('🗑️ Deleted old May 31st payment:', deleted.count)
    
    // Create June payment due on June 10th (same day as other payments)
    const junePayment = await prisma.payment.create({
      data: {
        contractId: contract.id,
        amount: contract.rentAmount,
        dueDate: new Date('2025-06-10'), // June 10th - past due by 5 days
        status: 'OVERDUE'
      }
    })
    
    console.log('✅ Created June payment due 2025-06-10, Status: OVERDUE')
    console.log('💰 Amount:', junePayment.amount)
    
    // Calculate late fees for 5 days overdue
    const daysPastDue = 5
    const penalty = junePayment.amount * (2.0 / 100)
    const interest = junePayment.amount * (0.033 / 100) * daysPastDue
    console.log(`📊 Late fees - Penalty: R$ ${penalty.toFixed(2)}, Interest: R$ ${interest.toFixed(2)}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createJunePayment()
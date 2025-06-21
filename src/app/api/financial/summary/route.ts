import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching financial summary...')
    
    // Verificar autenticação
    const user = await requireAuth(request)
    console.log('👤 User authenticated:', user.email)
    
    // Data atual
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() retorna 0-11
    
    console.log('📅 Calculating for:', { year: currentYear, month: currentMonth })
    
    // 1. RECEITAS DO MÊS - Taxas de administração dos pagamentos PAGOS do mês atual
    const paidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        contract: {
          userId: user.id,
          status: 'ACTIVE'
        },
        paidDate: {
          gte: new Date(currentYear, currentMonth - 1, 1), // Primeiro dia do mês
          lt: new Date(currentYear, currentMonth, 1) // Primeiro dia do próximo mês
        }
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })
    
    // Calcular receitas das taxas de administração
    let totalRevenue = 0
    const revenueBreakdown = paidPayments.map(payment => {
      const adminFee = (payment.amount * payment.contract.administrationFeePercentage) / 100
      const managementFee = (payment.amount * payment.contract.managementFeePercentage) / 100
      const totalFee = adminFee + managementFee
      
      totalRevenue += totalFee
      
      return {
        paymentId: payment.id,
        property: payment.contract.property.title,
        tenant: payment.contract.tenant.name,
        rentAmount: payment.amount,
        adminFeePercentage: payment.contract.administrationFeePercentage,
        managementFeePercentage: payment.contract.managementFeePercentage,
        adminFee,
        managementFee,
        totalFee,
        paidDate: payment.paidDate
      }
    })
    
    console.log('💰 Total revenue from admin fees:', totalRevenue)
    
    // 2. DESPESAS DO MÊS - Gastos registrados no sistema
    const monthlyExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        year: currentYear,
        month: currentMonth
      }
    })
    
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    console.log('💸 Total expenses:', totalExpenses)
    
    // 3. LUCRO LÍQUIDO
    const netProfit = totalRevenue - totalExpenses
    
    // 4. COMPARAÇÃO COM MÊS ANTERIOR
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear
    
    // Receitas mês anterior
    const previousPaidPayments = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        contract: {
          userId: user.id,
          status: 'ACTIVE'
        },
        paidDate: {
          gte: new Date(previousYear, previousMonth - 1, 1),
          lt: new Date(previousYear, previousMonth, 1)
        }
      },
      include: {
        contract: true
      }
    })
    
    let previousRevenue = 0
    previousPaidPayments.forEach(payment => {
      const adminFee = (payment.amount * payment.contract.administrationFeePercentage) / 100
      const managementFee = (payment.amount * payment.contract.managementFeePercentage) / 100
      previousRevenue += adminFee + managementFee
    })
    
    // Despesas mês anterior
    const previousExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        year: previousYear,
        month: previousMonth
      }
    })
    
    const previousTotalExpenses = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const previousNetProfit = previousRevenue - previousTotalExpenses
    
    // Calcular variações percentuais
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const expensesChange = previousTotalExpenses > 0 ? ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100 : 0
    const profitChange = previousNetProfit > 0 ? ((netProfit - previousNetProfit) / previousNetProfit) * 100 : 0
    
    const summary = {
      currentMonth: {
        year: currentYear,
        month: currentMonth,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit: netProfit,
        paymentsCount: paidPayments.length,
        expensesCount: monthlyExpenses.length
      },
      previousMonth: {
        year: previousYear,
        month: previousMonth,
        revenue: previousRevenue,
        expenses: previousTotalExpenses,
        netProfit: previousNetProfit
      },
      changes: {
        revenue: revenueChange,
        expenses: expensesChange,
        profit: profitChange
      },
      breakdown: {
        revenue: revenueBreakdown,
        expenses: monthlyExpenses.map(expense => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date
        }))
      }
    }
    
    console.log('📊 Financial summary calculated:', {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: netProfit
    })
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Error fetching financial summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial summary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
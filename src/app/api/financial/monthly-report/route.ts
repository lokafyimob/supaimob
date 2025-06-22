import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    console.log(`🔍 Generating report for ${month}/${year} for user ${user.email}`)

    // Get paid payments for the month (using paidDate instead of paidAt)
    const paidPayments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: user.id
        },
        status: 'PAID',
        paidDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1)
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

    console.log(`📊 Found ${paidPayments.length} paid payments`)

    // Calculate revenue from admin fees (10% of rent amount)
    const adminFeeRate = 0.10
    let totalRent = 0
    let totalAdminFee = 0
    
    const revenueBreakdown = paidPayments.map(payment => {
      const rentAmount = payment.amount
      const adminFee = rentAmount * adminFeeRate
      totalRent += rentAmount
      totalAdminFee += adminFee
      
      return {
        paymentId: payment.id,
        property: payment.contract.property.title,
        tenant: payment.contract.tenant.name,
        rentAmount: rentAmount,
        adminFeePercentage: adminFeeRate * 100,
        managementFeePercentage: 0,
        adminFee: adminFee,
        managementFee: 0,
        totalFee: adminFee,
        paidDate: payment.paidDate?.toISOString() || payment.updatedAt.toISOString()
      }
    })

    // Get expenses for the month
    const expenses = await prisma.expense.findMany({
      where: {
        year: year,
        month: month,
        ...(user.companyId && { companyId: user.companyId })
      }
    })

    console.log(`💰 Found ${expenses.length} expenses`)

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc: any[], expense) => {
      const existing = acc.find(item => item.category === expense.category)
      if (existing) {
        existing.category_total = (parseFloat(existing.category_total) + expense.amount).toString()
      } else {
        acc.push({
          category: expense.category,
          category_total: expense.amount.toString()
        })
      }
      return acc
    }, [])

    const expenseBreakdown = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString()
    }))

    // Calculate profit
    const netRevenue = totalAdminFee // Our revenue is the admin fee, not the full rent
    const profit = netRevenue - totalExpenses
    const profitMargin = netRevenue > 0 ? (profit / netRevenue * 100) : 0

    console.log(`📈 Report summary: Revenue=${netRevenue}, Expenses=${totalExpenses}, Profit=${profit}`)

    return NextResponse.json({
      year,
      month,
      revenue: {
        totalRent: totalRent,
        adminFee: totalAdminFee,
        netRevenue: netRevenue,
        paymentCount: paidPayments.length
      },
      expenses: {
        total: totalExpenses,
        count: expenses.length,
        byCategory: expensesByCategory
      },
      profit: profit,
      summary: {
        totalRevenue: netRevenue,
        totalExpenses: totalExpenses,
        netProfit: profit,
        profitMargin: profitMargin
      },
      breakdown: {
        revenue: revenueBreakdown,
        expenses: expenseBreakdown
      }
    })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    return NextResponse.json(
      { error: 'Failed to generate monthly report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Get current month's paid payments (revenue)
    const currentMonthRevenue = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0) as total_rent,
        COUNT(*) as payment_count
      FROM "Payment"
      WHERE status = 'paid'
        AND EXTRACT(YEAR FROM "paidAt") = ${year}
        AND EXTRACT(MONTH FROM "paidAt") = ${month}
    `

    // Get current month's expenses
    const currentMonthExpenses = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0) as total_expenses,
        COUNT(*) as expense_count,
        category,
        SUM(amount) as category_total
      FROM "Expense"
      WHERE year = ${year} AND month = ${month}
      GROUP BY category
      ORDER BY category_total DESC
    `

    const totalExpenses = await prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM "Expense"
      WHERE year = ${year} AND month = ${month}
    `

    // Calculate admin fee (assuming 10% of rent)
    const revenue = currentMonthRevenue[0] || { total_rent: 0, payment_count: 0 }
    const adminFeeRate = 0.10 // 10%
    const adminFee = parseFloat(revenue.total_rent) * adminFeeRate
    const netRevenue = parseFloat(revenue.total_rent) - adminFee
    const expenses = parseFloat(totalExpenses[0]?.total || 0)
    const profit = netRevenue - expenses

    // Update or create monthly revenue record
    await prisma.$executeRaw`
      INSERT INTO "MonthlyRevenue" (year, month, "totalRent", "adminFee", "netRevenue", "paymentCount", "updatedAt")
      VALUES (${year}, ${month}, ${revenue.total_rent}, ${adminFee}, ${netRevenue}, ${revenue.payment_count}, CURRENT_TIMESTAMP)
      ON CONFLICT (year, month) 
      DO UPDATE SET 
        "totalRent" = ${revenue.total_rent},
        "adminFee" = ${adminFee},
        "netRevenue" = ${netRevenue},
        "paymentCount" = ${revenue.payment_count},
        "updatedAt" = CURRENT_TIMESTAMP
    `

    return NextResponse.json({
      year,
      month,
      revenue: {
        totalRent: parseFloat(revenue.total_rent),
        adminFee: adminFee,
        netRevenue: netRevenue,
        paymentCount: parseInt(revenue.payment_count)
      },
      expenses: {
        total: expenses,
        count: currentMonthExpenses.length,
        byCategory: currentMonthExpenses
      },
      profit: profit,
      summary: {
        totalRevenue: netRevenue,
        totalExpenses: expenses,
        netProfit: profit,
        profitMargin: netRevenue > 0 ? (profit / netRevenue * 100) : 0
      }
    })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    return NextResponse.json(
      { error: 'Failed to generate monthly report' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
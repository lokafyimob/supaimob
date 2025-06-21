import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Create MonthlyRevenue table for storing monthly revenue data
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MonthlyRevenue" (
        "id" SERIAL PRIMARY KEY,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "totalRent" DECIMAL(10,2) DEFAULT 0,
        "adminFee" DECIMAL(10,2) DEFAULT 0,
        "netRevenue" DECIMAL(10,2) DEFAULT 0,
        "paymentCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("year", "month")
      )
    `

    // Create Expenses table for managing monthly expenses
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" SERIAL PRIMARY KEY,
        "description" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "date" DATE NOT NULL,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "type" VARCHAR(30) DEFAULT 'operational',
        "receipt" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes for better performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_monthly_revenue_year_month" ON "MonthlyRevenue"("year", "month")
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_expense_year_month" ON "Expense"("year", "month")
    `

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_expense_category" ON "Expense"("category")
    `

    return NextResponse.json({
      success: true,
      message: 'Financial tables created successfully',
      tables: ['MonthlyRevenue', 'Expense']
    })
  } catch (error) {
    console.error('Error creating financial tables:', error)
    return NextResponse.json(
      { error: 'Failed to create financial tables: ' + error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
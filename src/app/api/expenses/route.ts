import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let whereClause = {}
    
    if (year && month) {
      whereClause = {
        year: parseInt(year),
        month: parseInt(month)
      }
    } else if (year) {
      whereClause = {
        year: parseInt(year)
      }
    }

    const expenses = await prisma.$queryRaw`
      SELECT 
        id,
        description,
        amount,
        category,
        date,
        year,
        month,
        type,
        receipt,
        notes,
        "createdAt",
        "updatedAt"
      FROM "Expense"
      ${year ? `WHERE year = ${parseInt(year)}` : ''}
      ${year && month ? `AND month = ${parseInt(month)}` : ''}
      ORDER BY date DESC, "createdAt" DESC
    `

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, amount, category, date, type = 'operational', receipt, notes } = body

    if (!description || !amount || !category || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: description, amount, category, date' },
        { status: 400 }
      )
    }

    const expenseDate = new Date(date)
    const year = expenseDate.getFullYear()
    const month = expenseDate.getMonth() + 1

    const expense = await prisma.$executeRaw`
      INSERT INTO "Expense" (
        description, amount, category, date, year, month, type, receipt, notes
      ) VALUES (
        ${description}, ${parseFloat(amount)}, ${category}, ${date}, ${year}, ${month}, ${type}, ${receipt || null}, ${notes || null}
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Expense created successfully'
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
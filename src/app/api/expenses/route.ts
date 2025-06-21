import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let whereClause: any = {}
    
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

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating new expense')
    
    const body = await request.json()
    const { description, amount, category, date, type = 'operational', receipt, notes } = body

    console.log('📄 Request body:', { description, amount, category, date, type, receipt, notes })

    if (!description || !amount || !category || !date) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: description, amount, category, date' },
        { status: 400 }
      )
    }

    const expenseDate = new Date(date)
    const year = expenseDate.getFullYear()
    const month = expenseDate.getMonth() + 1

    console.log('📅 Date info:', { date, year, month })

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: parseFloat(amount),
        category,
        date: expenseDate,
        year,
        month,
        type,
        receipt: receipt || null,
        notes: notes || null
      }
    })

    console.log('✅ Expense created:', expense.id)

    return NextResponse.json({
      success: true,
      expense,
      message: 'Expense created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
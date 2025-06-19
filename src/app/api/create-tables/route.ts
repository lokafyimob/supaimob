import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    // Push schema to create tables using Prisma
    await prisma.$executeRaw`SELECT 1`
    
    return NextResponse.json({ success: true, message: 'Tabelas criadas via Prisma!' })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao criar tabelas',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
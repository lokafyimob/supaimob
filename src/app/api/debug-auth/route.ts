import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Testar se consegue encontrar o usuário
    const user = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    return NextResponse.json({
      userFound: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length,
      passwordStart: user?.password?.substring(0, 10) + '...',
      tableFields: Object.keys(user || {}),
      totalUsers: await prisma.user.count()
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
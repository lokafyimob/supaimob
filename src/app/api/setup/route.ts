import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(_request: NextRequest) {
  try {
    // Verificar se usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' }
    })
    
    if (!existingAdmin) {
      // Criar hash da senha
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      // Criar usuário admin
      await prisma.user.create({
        data: {
          id: 'admin-123',
          email: 'admin@crm.com',
          name: 'Admin',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Setup completo! Login: admin@crm.com / admin123' 
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro no setup',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

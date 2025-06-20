import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar se usuário está autenticado
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Usuário deve estar logado' },
        { status: 401 }
      )
    }

    // Promover o usuário atual a admin
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário promovido a administrador com sucesso',
      user: updatedUser
    })

  } catch (error) {
    console.error('Erro ao promover usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
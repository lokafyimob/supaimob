import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isBlocked } = await request.json()
    const { id } = await params

    const user = await prisma.user.update({
      where: { id },
      data: { 
        isBlocked,
        // Se bloqueando, também desativar
        ...(isBlocked && { isActive: false })
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error toggling user block status:', error)
    return NextResponse.json(
      { error: 'Erro ao alterar status do usuário' },
      { status: 500 }
    )
  }
}
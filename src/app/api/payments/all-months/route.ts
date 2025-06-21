import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS ALL MONTHS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // Buscar TODOS os pagamentos relacionados aos contratos do usuário (sem filtro de data)
    const payments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: user.id
        }
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    console.log(`📊 Encontrados ${payments.length} pagamentos (todos os meses) para o usuário ${user.email}`)

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching all payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar todos os pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
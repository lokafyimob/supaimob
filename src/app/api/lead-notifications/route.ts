import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    
    const whereClause: Record<string, any> = {
      lead: {
        userId: user.id
      }
    }

    if (leadId) {
      whereClause.leadId = leadId
    }

    const notifications = await prisma.leadNotification.findMany({
      where: whereClause,
      include: {
        lead: true,
        property: {
          include: {
            owner: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching lead notifications:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    const { notificationIds, markAsSent } = data
    
    // Verify that notifications belong to user's leads
    const notifications = await prisma.leadNotification.findMany({
      where: {
        id: { in: notificationIds },
        lead: {
          userId: user.id
        }
      }
    })

    if (notifications.length !== notificationIds.length) {
      return NextResponse.json(
        { error: 'Unauthorized access to notifications' },
        { status: 403 }
      )
    }

    // Update notifications
    await prisma.leadNotification.updateMany({
      where: {
        id: { in: notificationIds }
      },
      data: {
        sent: markAsSent,
        sentAt: markAsSent ? new Date() : null
      }
    })

    return NextResponse.json({ message: 'Notificações atualizadas com sucesso' })
  } catch (error) {
    console.error('Error updating notifications:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar notificações' },
      { status: 500 }
    )
  }
}
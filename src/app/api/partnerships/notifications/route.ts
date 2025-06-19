import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🔍 Buscando notificações de parceria...')

    // Buscar notificações de parceria para o usuário atual (que tem leads e deve ser notificado sobre parcerias)
    const notifications = await prisma.partnershipNotification.findMany({
      where: {
        toUserId: session.user.id, // Usuário que possui o lead (será notificado sobre oportunidade de parceria)
        viewed: false // Ainda não visualizadas
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limitar a 10 notificações mais recentes
    })

    console.log(`📨 ${notifications.length} notificações de parceria encontradas`)

    // Transformar as notificações para o formato esperado pelo componente
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      fromUserName: notification.fromUserName,
      fromUserPhone: notification.fromUserPhone,
      fromUserEmail: notification.fromUserEmail,
      leadName: notification.leadName,
      leadPhone: notification.leadPhone,
      propertyTitle: notification.propertyTitle,
      propertyPrice: notification.propertyPrice,
      matchType: notification.matchType,
      createdAt: notification.createdAt
    }))

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications
    })

  } catch (error) {
    console.error('Erro ao buscar notificações de parceria:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { notificationIds } = await request.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'IDs de notificação inválidos' }, { status: 400 })
    }

    console.log('✅ Marcando notificações como visualizadas:', notificationIds)

    // Marcar notificações como visualizadas
    await prisma.partnershipNotification.updateMany({
      where: {
        id: { in: notificationIds },
        toUserId: session.user.id // Garantir que só pode marcar suas próprias notificações
      },
      data: {
        viewed: true,
        viewedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notificações marcadas como visualizadas'
    })

  } catch (error) {
    console.error('Erro ao marcar notificações como visualizadas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
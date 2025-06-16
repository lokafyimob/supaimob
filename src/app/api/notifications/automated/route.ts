import { NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'
import { addDays, differenceInDays } from 'date-fns'

export async function POST() {
  try {
    const notificationService = new NotificationService()
    const notifications = []
    let paymentReminders = 0
    let overdueAlerts = 0
    let contractExpiringAlerts = 0

    // 1. Lembretes de pagamento (3 dias antes do vencimento)
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: addDays(new Date(), 3)
        }
      },
      include: {
        contract: {
          include: {
            tenant: true,
            property: true
          }
        }
      }
    })

    for (const payment of upcomingPayments) {
      const reminder = notificationService.generatePaymentReminderEmail(
        payment.contract.tenant.name,
        payment.contract.property.title,
        payment.amount,
        payment.dueDate.toLocaleDateString('pt-BR')
      )
      
      reminder.recipient = payment.contract.tenant.email
      reminder.companyId = payment.contract.companyId
      notifications.push(reminder)

      // Também enviar por WhatsApp se disponível
      if (payment.contract.tenant.phone) {
        const whatsappReminder = {
          ...reminder,
          type: 'WHATSAPP' as const,
          recipient: payment.contract.tenant.phone,
          companyId: payment.contract.companyId,
          message: `Olá ${payment.contract.tenant.name}! Lembrete: seu aluguel de R$ ${payment.amount.toLocaleString('pt-BR')} vence em ${payment.dueDate.toLocaleDateString('pt-BR')}. Imóvel: ${payment.contract.property.title}`
        }
        notifications.push(whatsappReminder)
      }
      
      paymentReminders++
    }

    // 2. Alertas de pagamentos em atraso
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'OVERDUE',
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        contract: {
          include: {
            tenant: true,
            property: true
          }
        }
      }
    })

    for (const payment of overduePayments) {
      const daysPastDue = differenceInDays(new Date(), payment.dueDate)
      
      const overdueAlert = notificationService.generateOverduePaymentAlert(
        payment.contract.tenant.name,
        payment.contract.property.title,
        payment.amount,
        daysPastDue
      )
      
      overdueAlert.recipient = payment.contract.tenant.email
      overdueAlert.companyId = payment.contract.companyId
      notifications.push(overdueAlert)

      // WhatsApp para casos urgentes (mais de 5 dias de atraso)
      if (payment.contract.tenant.phone && daysPastDue > 5) {
        const urgentWhatsapp = {
          ...overdueAlert,
          type: 'WHATSAPP' as const,
          recipient: payment.contract.tenant.phone,
          companyId: payment.contract.companyId,
          message: `URGENTE: ${payment.contract.tenant.name}, seu aluguel de R$ ${payment.amount.toLocaleString('pt-BR')} está ${daysPastDue} dias em atraso. Entre em contato: ${payment.contract.property.title}`
        }
        notifications.push(urgentWhatsapp)
      }
      
      overdueAlerts++
    }

    // 3. Alertas de contratos vencendo (30 dias antes)
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(),
          lte: addDays(new Date(), 30)
        }
      },
      include: {
        tenant: true,
        property: {
          include: {
            owner: true
          }
        }
      }
    })

    for (const contract of expiringContracts) {
      const contractAlert = notificationService.generateContractExpiringAlert(
        contract.property.owner.name,
        contract.tenant.name,
        contract.property.title,
        contract.endDate.toLocaleDateString('pt-BR')
      )
      
      contractAlert.recipient = contract.property.owner.email
      contractAlert.companyId = contract.companyId
      notifications.push(contractAlert)
      
      contractExpiringAlerts++
    }

    // 4. Salvar todas as notificações no banco
    for (const notification of notifications) {
      await prisma.notification.create({
        data: {
          type: notification.type === 'EMAIL' ? 'PAYMENT_REMINDER' : 'PAYMENT_REMINDER_WHATSAPP',
          priority: notification.priority,
          title: notification.subject,
          message: notification.message,
          recipient: notification.recipient,
          companyId: notification.companyId || '',
          metadata: JSON.stringify(notification.templateData || {})
        }
      })
    }

    // 5. Enviar todas as notificações
    let sentCount = 0
    let failedCount = 0

    if (notifications.length > 0) {
      const result = await notificationService.sendBulkNotifications(notifications)
      sentCount = result.sent
      failedCount = result.failed
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentReminders,
        overdueAlerts,
        contractExpiringAlerts,
        totalNotifications: notifications.length,
        sent: sentCount,
        failed: failedCount,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in automated notifications:', error)
    return NextResponse.json(
      { error: 'Erro no envio de notificações automáticas' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Estatísticas das notificações dos últimos 7 dias
    const weekAgo = addDays(new Date(), -7)
    
    const stats = await prisma.notification.groupBy({
      by: ['type', 'priority'],
      where: {
        createdAt: {
          gte: weekAgo
        }
      },
      _count: {
        id: true
      }
    })

    const recentNotifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: weekAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        priority: true,
        title: true,
        recipient: true,
        createdAt: true,
        sent: true
      }
    })

    const summary = {
      totalNotifications: recentNotifications.length,
      sentNotifications: recentNotifications.filter(n => n.sent).length,
      pendingNotifications: recentNotifications.filter(n => !n.sent).length,
      urgentNotifications: recentNotifications.filter(n => n.priority === 'URGENT').length,
      typeBreakdown: stats.reduce((acc, stat) => {
        acc[stat.type] = (acc[stat.type] || 0) + stat._count.id
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentNotifications,
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching notification stats:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas de notificações' },
      { status: 500 }
    )
  }
}
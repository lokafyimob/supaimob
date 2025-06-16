import { NextResponse } from 'next/server'
import { AIDelinquencyDetector } from '@/lib/ai-delinquency-detector'
import { NotificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const aiDetector = new AIDelinquencyDetector()
    const notificationService = new NotificationService()

    // Buscar todos os inquilinos com seus dados de pagamento
    const tenants = await prisma.tenant.findMany({
      include: {
        contracts: {
          include: {
            payments: {
              orderBy: { dueDate: 'desc' },
              take: 12 // últimos 12 pagamentos
            },
            property: true
          }
        }
      }
    })

    const analysisResults = new Map()
    const notifications = []

    for (const tenant of tenants) {
      const activeContract = tenant.contracts.find(c => c.status === 'ACTIVE')
      
      if (!activeContract) continue

      const tenantData = {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        income: tenant.income || 0,
        rentAmount: activeContract.rentAmount,
        contractStartDate: activeContract.startDate.toISOString(),
        paymentHistory: activeContract.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          dueDate: payment.dueDate.toISOString(),
          paidDate: payment.paidDate?.toISOString(),
          status: payment.status,
          penalty: payment.penalty || 0,
          interest: payment.interest || 0
        }))
      }

      // Analisar risco de inadimplência
      const prediction = await aiDetector.analyzeDelinquencyRisk(tenantData)
      analysisResults.set(tenant.id, prediction)

      // Gerar alertas se necessário
      if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL') {
        const alert = notificationService.generateDelinquencyRiskAlert(
          tenant.name,
          activeContract.property.title,
          prediction.riskLevel,
          prediction.probability
        )
        
        alert.recipient = tenant.email
        notifications.push(alert)

        // Salvar alerta no banco de dados
        await prisma.notification.create({
          data: {
            type: 'DELINQUENCY_RISK',
            priority: prediction.riskLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
            title: `Risco de Inadimplência - ${tenant.name}`,
            message: alert.message,
            recipient: tenant.email,
            tenantId: tenant.id,
            propertyId: activeContract.propertyId,
            companyId: activeContract.companyId,
            metadata: JSON.stringify({
              riskLevel: prediction.riskLevel,
              probability: prediction.probability,
              reasons: prediction.reasons,
              recommendations: prediction.recommendations
            })
          }
        })
      }
    }

    // Enviar notificações
    if (notifications.length > 0) {
      const result = await notificationService.sendBulkNotifications(notifications)
      console.log(`Enviadas ${result.sent} notificações de ${notifications.length} total`)
    }

    // Gerar relatório geral
    const report = await aiDetector.generateRiskReport(analysisResults)

    return NextResponse.json({
      success: true,
      data: {
        analyzedTenants: analysisResults.size,
        alertsSent: notifications.length,
        report,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in delinquency analysis:', error)
    return NextResponse.json(
      { error: 'Erro na análise de inadimplência' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Buscar histórico de análises recentes
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: 'DELINQUENCY_RISK',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 dias
        }
      },
      include: {
        tenant: {
          select: { name: true }
        },
        property: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const stats = {
      totalAlerts: recentNotifications.length,
      urgentAlerts: recentNotifications.filter(n => n.priority === 'URGENT').length,
      highRiskAlerts: recentNotifications.filter(n => n.priority === 'HIGH').length,
      averageRiskLevel: recentNotifications.reduce((acc, n) => {
        const metadata = n.metadata ? JSON.parse(n.metadata) : {}
        const risk = metadata.riskLevel
        if (risk === 'CRITICAL') return acc + 4
        if (risk === 'HIGH') return acc + 3
        if (risk === 'MEDIUM') return acc + 2
        return acc + 1
      }, 0) / recentNotifications.length || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentNotifications: recentNotifications.map(notification => {
          const metadata = notification.metadata ? JSON.parse(notification.metadata) : {}
          return {
            id: notification.id,
            tenantName: notification.tenant?.name,
            propertyTitle: notification.property?.title,
            riskLevel: metadata.riskLevel,
            probability: metadata.probability,
            createdAt: notification.createdAt,
            priority: notification.priority
          }
        })
      }
    })

  } catch (error) {
    console.error('Error fetching delinquency analytics:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar análises de inadimplência' },
      { status: 500 }
    )
  }
}
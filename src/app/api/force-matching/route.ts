import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🔥 FORCE MATCHING INICIADO')

    // IDs do debug atual
    const leadId = "cmc41mvp40001l804c3ate3yz"
    const propertyId = "cmc3zeuv50003js04bh64bhj2"

    // Buscar dados completos
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    if (!lead || !property) {
      return NextResponse.json({ error: 'Lead ou propriedade não encontrada' }, { status: 404 })
    }

    console.log('📋 Dados encontrados:')
    console.log('Lead:', lead.name, 'Usuario:', lead.user.name)
    console.log('Propriedade:', property.title, 'Usuario:', property.user.name)
    console.log('Aceita parceria:', property.acceptsPartnership)

    // Verificar se já existe notificação
    const existingNotification = await prisma.partnershipNotification.findFirst({
      where: {
        fromUserId: lead.userId,
        toUserId: property.userId,
        leadId: lead.id,
        propertyId: property.id
      }
    })

    if (existingNotification) {
      console.log('⚠️ Notificação já existe:', existingNotification.id)
      return NextResponse.json({
        success: true,
        message: 'Notificação já existe',
        notification: existingNotification
      })
    }

    // Buscar telefone do usuário do lead
    let userPhone = lead.user.phone
    if (!userPhone && lead.user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: lead.user.companyId },
        select: { phone: true }
      })
      userPhone = company?.phone || null
    }

    const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)

    console.log('💰 Preço alvo:', targetPrice)
    console.log('📞 Telefone:', userPhone)

    // Forçar criação da notificação
    const notification = await prisma.partnershipNotification.create({
      data: {
        fromUserId: lead.userId,        // BS IMÓVEIS (quem tem o lead)
        toUserId: property.userId,      // DACRUZ IMÓVEIS (quem tem a propriedade)
        leadId: lead.id,
        propertyId: property.id,
        fromUserName: lead.user.name || '',
        fromUserPhone: userPhone,
        fromUserEmail: lead.user.email || '',
        leadName: lead.name,
        leadPhone: lead.phone,
        propertyTitle: property.title,
        propertyPrice: targetPrice,
        matchType: lead.interest,
        sent: false
      }
    })

    console.log('✅ Notificação criada:', notification.id)

    // Verificar se foi criada corretamente
    const verifyNotification = await prisma.partnershipNotification.findUnique({
      where: { id: notification.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Notificação de parceria criada com sucesso!',
      notification: verifyNotification,
      debug: {
        leadUser: lead.user.name,
        propertyUser: property.user.name,
        acceptsPartnership: property.acceptsPartnership,
        targetPrice,
        userPhone
      }
    })

  } catch (error) {
    console.error('❌ Erro no force matching:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
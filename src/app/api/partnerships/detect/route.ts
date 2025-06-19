import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🔍 Detectando oportunidades de parceria...')
    console.log('👤 Usuário atual:', session.user.id, session.user.email)

    // LÓGICA CORRIGIDA: Buscar imóveis do usuário atual que aceitem parceria
    const userPropertiesWithPartnership = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        acceptsPartnership: true,
        status: 'AVAILABLE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    console.log(`🏠 ${userPropertiesWithPartnership.length} imóveis com parceria encontrados para o usuário`)

    const partnerships: {
      fromUserId: string
      toUserId: string
      leadId: string
      propertyId: string
      fromUserName: string
      fromUserPhone: string | null
      fromUserEmail: string
      leadName: string
      leadPhone: string
      propertyTitle: string
      propertyPrice: number
      matchType: string
    }[] = []

    // Para cada imóvel com parceria, buscar leads de outros usuários que façam match
    for (const property of userPropertiesWithPartnership) {
      try {
        console.log(`🔍 Buscando leads compatíveis para imóvel: ${property.title} (${property.propertyType})`)
        
        // Parse do availableFor do imóvel
        const availableFor = JSON.parse(property.availableFor || '[]')
        
        // Buscar leads de outros usuários que façam match com este imóvel
        const matchingLeads = await prisma.lead.findMany({
          where: {
            AND: [
              { userId: { not: session.user.id } }, // Não é do usuário atual (dono do imóvel)
              { status: 'ACTIVE' }, // Lead ativo
              { propertyType: property.propertyType }, // Tipo de imóvel compatível
              // Interesse compatível com disponibilidade
              availableFor.includes('RENT') && availableFor.includes('SALE') ? {
                OR: [
                  { interest: 'RENT' },
                  { interest: 'BUY' }
                ]
              } : availableFor.includes('RENT') ? {
                interest: 'RENT'
              } : availableFor.includes('SALE') ? {
                interest: 'BUY'
              } : { interest: 'RENT' } // fallback
            ]
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                companyId: true
              }
            }
          }
        })

        console.log(`👥 ${matchingLeads.length} leads compatíveis encontrados para o imóvel ${property.title}`)

        // Para cada lead compatível, verificar compatibilidade detalhada e criar oportunidade de parceria
        for (const lead of matchingLeads) {
          // Buscar dados da empresa do usuário para usar como fallback no telefone
          let userPhone = lead.user.phone
          
          console.log(`📞 Telefone do usuário ${lead.user.name}: ${userPhone}`)
          
          if (!userPhone && lead.user.companyId) {
            console.log(`🏢 Buscando telefone da empresa para ${lead.user.name}...`)
            const userCompany = await prisma.company.findUnique({
              where: { id: lead.user.companyId },
              select: { phone: true }
            })
            userPhone = userCompany?.phone || null
            console.log(`🏢 Telefone da empresa: ${userPhone}`)
          }
          
          if (!userPhone) {
            console.log(`⚠️ PROBLEMA: Usuário ${lead.user.name} não tem telefone nem na empresa!`)
          }

          // Parse dos dados do lead para verificação detalhada
          const preferredCities = JSON.parse(lead.preferredCities || '[]')
          const preferredStates = JSON.parse(lead.preferredStates || '[]')
          
          // Verificar compatibilidade detalhada
          let isMatch = true
          
          // Verificar preço
          if (lead.interest === 'RENT' && property.rentPrice) {
            if (lead.minPrice && property.rentPrice < lead.minPrice) isMatch = false
            if (property.rentPrice > lead.maxPrice) isMatch = false
          } else if (lead.interest === 'BUY' && property.salePrice) {
            if (lead.minPrice && property.salePrice < lead.minPrice) isMatch = false
            if (property.salePrice > lead.maxPrice) isMatch = false
          }
          
          // Verificar quartos
          if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) isMatch = false
          if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) isMatch = false
          
          // Verificar banheiros
          if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) isMatch = false
          if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) isMatch = false
          
          // Verificar área
          if (lead.minArea && property.area < lead.minArea) isMatch = false
          if (lead.maxArea && property.area > lead.maxArea) isMatch = false
          
          // Verificar localização
          if (preferredCities.length > 0) {
            if (!preferredCities.includes(property.city)) {
              if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
                isMatch = false
              }
            }
          }
          
          if (!isMatch) continue // Pular se não é compatível
          
          // Verificar se já não foi notificado recentemente (últimas 24h)
          const existingNotification = await prisma.partnershipNotification.findFirst({
            where: {
              fromUserId: lead.userId, // Dono do lead (quem TEM o cliente)
              toUserId: session.user.id, // Dono do imóvel (quem será notificado)
              leadId: lead.id,
              propertyId: property.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 horas atrás
              }
            }
          })

          if (!existingNotification) {
            const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
            
            // LÓGICA CORRIGIDA: Notificação para o dono do LEAD sobre dono do IMÓVEL
            partnerships.push({
              fromUserId: lead.userId, // Dono do lead (quem TEM o cliente interessado)
              toUserId: session.user.id, // Dono do imóvel (quem será notificado)
              leadId: lead.id,
              propertyId: property.id,
              fromUserName: lead.user.name || '', // Nome de quem TEM o cliente (dono do lead)
              fromUserPhone: userPhone, // Telefone do usuário ou da empresa como fallback
              fromUserEmail: lead.user.email || '',
              leadName: lead.name,
              leadPhone: lead.phone,
              propertyTitle: property.title,
              propertyPrice: targetPrice,
              matchType: lead.interest
            })
          }
        }

      } catch (error) {
        console.error(`Erro ao processar imóvel ${property.id}:`, error)
      }
    }

    console.log(`🤝 ${partnerships.length} oportunidades de parceria detectadas`)

    // Criar as notificações de parceria
    if (partnerships.length > 0) {
      // Criar as notificações com os dados já corretos nos partnerships
      const notificationsToCreate = partnerships

      await prisma.partnershipNotification.createMany({
        data: notificationsToCreate
      })

      console.log(`📨 ${partnerships.length} notificações de parceria criadas`)
    }

    return NextResponse.json({
      success: true,
      partnerships: partnerships.length,
      message: partnerships.length > 0 
        ? `${partnerships.length} oportunidades de parceria detectadas!`
        : 'Nenhuma oportunidade de parceria encontrada no momento.'
    })

  } catch (error) {
    console.error('Erro ao detectar parcerias:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
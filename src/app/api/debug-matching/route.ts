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

    console.log('🔍 DEBUG MATCHING - Usuário:', session.user.id, session.user.email)

    // Buscar todas as propriedades que aceitam parceria
    const propertiesWithPartnership = await prisma.property.findMany({
      where: {
        acceptsPartnership: true,
        status: 'AVAILABLE'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Buscar todos os leads ativos
    const activeLeads = await prisma.lead.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Buscar notificações de parceria existentes
    const partnershipNotifications = await prisma.partnershipNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Análise de matches potenciais
    const potentialMatches = []
    
    for (const property of propertiesWithPartnership) {
      for (const lead of activeLeads) {
        // Só parcerias (usuários diferentes)
        if (property.userId !== lead.userId) {
          const availableFor = JSON.parse(property.availableFor || '[]')
          const preferredCities = JSON.parse(lead.preferredCities || '[]')
          
          let isMatch = true
          let matchReasons = []
          let noMatchReasons = []
          
          // Verificar tipo
          if (property.propertyType !== lead.propertyType) {
            isMatch = false
            noMatchReasons.push(`Tipo diferente: ${property.propertyType} vs ${lead.propertyType}`)
          } else {
            matchReasons.push(`Tipo compatível: ${property.propertyType}`)
          }
          
          // Verificar interesse vs disponibilidade
          if (lead.interest === 'RENT' && !availableFor.includes('RENT')) {
            isMatch = false
            noMatchReasons.push(`Lead quer alugar mas propriedade não está para alugar`)
          } else if (lead.interest === 'BUY' && !availableFor.includes('SALE')) {
            isMatch = false
            noMatchReasons.push(`Lead quer comprar mas propriedade não está à venda`)
          } else {
            matchReasons.push(`Interesse compatível: ${lead.interest}`)
          }
          
          // Verificar preço
          const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
          if (targetPrice) {
            if (lead.minPrice && targetPrice < lead.minPrice) {
              isMatch = false
              noMatchReasons.push(`Preço baixo: R$ ${targetPrice} < R$ ${lead.minPrice}`)
            } else if (targetPrice > lead.maxPrice) {
              isMatch = false
              noMatchReasons.push(`Preço alto: R$ ${targetPrice} > R$ ${lead.maxPrice}`)
            } else {
              matchReasons.push(`Preço compatível: R$ ${targetPrice}`)
            }
          }
          
          // Verificar cidade
          if (preferredCities.length > 0 && !preferredCities.includes(property.city)) {
            isMatch = false
            noMatchReasons.push(`Cidade incompatível: ${property.city} não está em ${preferredCities.join(', ')}`)
          } else {
            matchReasons.push(`Cidade compatível: ${property.city}`)
          }
          
          // Verificar quartos
          if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) {
            isMatch = false
            noMatchReasons.push(`Poucos quartos: ${property.bedrooms} < ${lead.minBedrooms}`)
          } else if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) {
            isMatch = false
            noMatchReasons.push(`Muitos quartos: ${property.bedrooms} > ${lead.maxBedrooms}`)
          } else {
            matchReasons.push(`Quartos compatíveis: ${property.bedrooms}`)
          }
          
          potentialMatches.push({
            propertyId: property.id,
            propertyTitle: property.title,
            propertyUser: property.user.name,
            propertyCity: property.city,
            propertyType: property.propertyType,
            propertyPrice: targetPrice,
            leadId: lead.id,
            leadName: lead.name,
            leadUser: lead.user.name,
            leadInterest: lead.interest,
            leadMaxPrice: lead.maxPrice,
            isMatch,
            matchReasons,
            noMatchReasons
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        currentUser: {
          id: session.user.id,
          email: session.user.email
        },
        propertiesWithPartnership: propertiesWithPartnership.length,
        activeLeads: activeLeads.length,
        partnershipNotifications: partnershipNotifications.length,
        potentialMatches: potentialMatches.length
      },
      data: {
        properties: propertiesWithPartnership.map(p => ({
          id: p.id,
          title: p.title,
          user: p.user.name,
          city: p.city,
          type: p.propertyType,
          availableFor: JSON.parse(p.availableFor || '[]'),
          rentPrice: p.rentPrice,
          salePrice: p.salePrice
        })),
        leads: activeLeads.map(l => ({
          id: l.id,
          name: l.name,
          user: l.user.name,
          interest: l.interest,
          type: l.propertyType,
          maxPrice: l.maxPrice,
          cities: JSON.parse(l.preferredCities || '[]')
        })),
        recentNotifications: partnershipNotifications.slice(0, 5),
        potentialMatches: potentialMatches.filter(m => m.isMatch).slice(0, 10),
        noMatches: potentialMatches.filter(m => !m.isMatch).slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Erro no debug matching:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
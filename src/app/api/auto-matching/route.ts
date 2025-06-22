import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('🤖 AUTO MATCHING INICIADO')

    // Buscar todas as propriedades que aceitam parceria
    const propertiesWithPartnership = await prisma.property.findMany({
      where: {
        acceptsPartnership: true,
        status: 'AVAILABLE'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
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
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    console.log(`🏠 ${propertiesWithPartnership.length} propriedades com parceria`)
    console.log(`👥 ${activeLeads.length} leads ativos`)

    let notificationsCreated = 0
    let matchesFound = 0

    // Para cada propriedade com parceria
    for (const property of propertiesWithPartnership) {
      // Buscar leads de outros usuários que façam match
      for (const lead of activeLeads) {
        // Só parcerias (usuários diferentes)
        if (property.userId !== lead.userId) {
          const isMatch = await checkDetailedMatch(property, lead)
          
          if (isMatch) {
            matchesFound++
            console.log(`✅ Match: ${lead.name} (${lead.user.name}) x ${property.title} (${property.user.name})`)
            
            // Verificar se já existe notificação (últimas 24h)
            const existingNotification = await prisma.partnershipNotification.findFirst({
              where: {
                fromUserId: lead.userId,
                toUserId: property.userId,
                leadId: lead.id,
                propertyId: property.id,
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
                }
              }
            })

            if (!existingNotification) {
              // Buscar telefone
              let userPhone = lead.user.phone
              if (!userPhone && lead.user.companyId) {
                const company = await prisma.company.findUnique({
                  where: { id: lead.user.companyId },
                  select: { phone: true }
                })
                userPhone = company?.phone || null
              }

              const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
              
              // Criar título detalhado
              const detailedTitle = `${property.title} - ${property.bedrooms}🛏 ${property.bathrooms}🛁 - ${property.city}`
              
              console.log(`📨 Criando notificação: ${lead.user.name} → ${property.user.name}`)
              console.log(`🏠 Detalhes: ${detailedTitle}`)
              
              // Criar notificação
              await prisma.partnershipNotification.create({
                data: {
                  fromUserId: lead.userId,
                  toUserId: property.userId,
                  leadId: lead.id,
                  propertyId: property.id,
                  fromUserName: lead.user.name || '',
                  fromUserPhone: userPhone,
                  fromUserEmail: lead.user.email || '',
                  leadName: lead.name,
                  leadPhone: lead.phone,
                  propertyTitle: detailedTitle,
                  propertyPrice: targetPrice,
                  matchType: lead.interest,
                  sent: false
                }
              })
              
              notificationsCreated++
              console.log(`✅ Notificação criada! Total: ${notificationsCreated}`)
            } else {
              console.log(`⚠️ Notificação já existe (${existingNotification.createdAt})`)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto matching concluído! ${matchesFound} matches encontrados, ${notificationsCreated} notificações criadas.`,
      results: {
        propertiesWithPartnership: propertiesWithPartnership.length,
        activeLeads: activeLeads.length,
        matchesFound,
        notificationsCreated
      }
    })

  } catch (error) {
    console.error('❌ Erro no auto matching:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Função para verificar match detalhado
async function checkDetailedMatch(property: any, lead: any): Promise<boolean> {
  try {
    // Verificar tipo
    if (property.propertyType !== lead.propertyType) return false
    
    // Verificar disponibilidade vs interesse
    const availableFor = JSON.parse(property.availableFor || '[]')
    if (lead.interest === 'RENT' && !availableFor.includes('RENT')) return false
    if (lead.interest === 'BUY' && !availableFor.includes('SALE')) return false
    
    // Verificar preço
    const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
    if (targetPrice) {
      if (lead.minPrice && targetPrice < lead.minPrice) return false
      // 🔥 ULTRAPHINK: Verificar preço máximo rigorosamente
      if (lead.maxPrice && lead.maxPrice > 0 && targetPrice > lead.maxPrice) return false
    }
    
    // Verificar quartos
    if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) return false
    if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) return false
    
    // Verificar banheiros
    if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) return false
    if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) return false
    
    // Verificar área
    if (lead.minArea && property.area < lead.minArea) return false
    if (lead.maxArea && property.area > lead.maxArea) return false
    
    // Verificar cidade (case insensitive)
    const preferredCities = JSON.parse(lead.preferredCities || '[]')
    if (preferredCities.length > 0) {
      const citiesLowerCase = preferredCities.map((city: string) => city.toLowerCase().trim())
      const propertyCityLower = property.city.toLowerCase().trim()
      
      if (!citiesLowerCase.includes(propertyCityLower)) {
        const preferredStates = JSON.parse(lead.preferredStates || '[]')
        if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
          return false
        }
      }
    }
    
    // Verificar financiamento (apenas para compra)
    if (lead.interest === 'BUY' && lead.needsFinancing && !property.acceptsFinancing) {
      return false
    }
    
    return true
  } catch (error) {
    console.error('Erro ao verificar match:', error)
    return false
  }
}

// GET para facilitar testes
export async function GET(request: NextRequest) {
  return POST(request)
}
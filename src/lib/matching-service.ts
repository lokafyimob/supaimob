import { prisma } from '@/lib/db'

/**
 * Verifica matches de leads quando uma propriedade é criada/editada
 */
export async function checkForLeadMatches(propertyId: string) {
  try {
    console.log(`🔍 Verificando matches para propriedade: ${propertyId}`)
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!property) {
      console.log('❌ Propriedade não encontrada')
      return
    }

    // Parse availableFor
    const availableFor = JSON.parse(property.availableFor || '[]')
    
    // Buscar leads compatíveis (mesmo usuário + outros usuários para parceria)
    const compatibleLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          { propertyType: property.propertyType },
          // Interesse compatível
          availableFor.includes('RENT') && availableFor.includes('SALE') ? {
            OR: [
              { interest: 'RENT' },
              { interest: 'BUY' }
            ]
          } : availableFor.includes('RENT') ? {
            interest: 'RENT'
          } : availableFor.includes('SALE') ? {
            interest: 'BUY'
          } : { interest: 'RENT' }
        ]
      }
    })

    console.log(`👥 ${compatibleLeads.length} leads compatíveis encontrados`)

    for (const lead of compatibleLeads) {
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
      const preferredCities = JSON.parse(lead.preferredCities || '[]')
      const preferredStates = JSON.parse(lead.preferredStates || '[]')
      
      if (preferredCities.length > 0) {
        if (!preferredCities.includes(property.city)) {
          if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
            isMatch = false
          }
        }
      }
      
      if (isMatch) {
        console.log(`✅ Match encontrado! Lead ${lead.name} x Propriedade ${property.title}`)
        
        if (lead.userId === property.userId) {
          // Match do mesmo usuário - criar notificação e vincular
          console.log(`👤 Match próprio: ${lead.user.name}`)
          
          await prisma.leadNotification.create({
            data: {
              leadId: lead.id,
              propertyId: property.id,
              type: 'PROPERTY_MATCH',
              title: `Match Encontrado: ${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m²`,
              message: `A propriedade "${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m² - ${property.city}" faz match com o lead "${lead.name}"!`,
              sent: false
            }
          })

          await prisma.lead.update({
            where: { id: lead.id },
            data: { matchedPropertyId: property.id }
          })
          
        } else if (property.acceptsPartnership) {
          // Match de parceria - criar notificação de parceria
          console.log(`🤝 Match parceria: ${lead.user.name} → ${property.user.name}`)
          
          // Verificar se já não foi notificado
          const existingNotification = await prisma.partnershipNotification.findFirst({
            where: {
              fromUserId: lead.userId,
              toUserId: property.userId,
              leadId: lead.id,
              propertyId: property.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
              }
            }
          })

          if (!existingNotification) {
            let userPhone = lead.user.phone
            if (!userPhone && lead.user.companyId) {
              const company = await prisma.company.findUnique({
                where: { id: lead.user.companyId },
                select: { phone: true }
              })
              userPhone = company?.phone || null
            }

            const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
            
            // Criar título detalhado com quartos, banheiros e área
            const detailedTitle = `${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m² - ${property.city}`
            
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
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar matches de leads:', error)
  }
}

/**
 * Verifica oportunidades de parceria quando uma propriedade aceita parceria
 */
export async function checkForPartnershipOpportunities(propertyId: string, userId: string) {
  try {
    console.log(`🤝 Verificando parcerias para propriedade: ${propertyId}`)
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    if (!property || !property.acceptsPartnership) {
      console.log('❌ Propriedade não aceita parceria')
      return
    }

    // Parse availableFor
    const availableFor = JSON.parse(property.availableFor || '[]')
    
    // Buscar leads de OUTROS usuários
    const matchingLeads = await prisma.lead.findMany({
      where: {
        AND: [
          { userId: { not: userId } }, // Outros usuários
          { status: 'ACTIVE' },
          { propertyType: property.propertyType },
          // Interesse compatível
          availableFor.includes('RENT') && availableFor.includes('SALE') ? {
            OR: [
              { interest: 'RENT' },
              { interest: 'BUY' }
            ]
          } : availableFor.includes('RENT') ? {
            interest: 'RENT'
          } : availableFor.includes('SALE') ? {
            interest: 'BUY'
          } : { interest: 'RENT' }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    console.log(`👥 ${matchingLeads.length} leads de outros usuários encontrados`)

    for (const lead of matchingLeads) {
      // Verificar compatibilidade detalhada (mesmo código de cima)
      let isMatch = true
      
      // Verificar preço
      if (lead.interest === 'RENT' && property.rentPrice) {
        if (lead.minPrice && property.rentPrice < lead.minPrice) isMatch = false
        if (property.rentPrice > lead.maxPrice) isMatch = false
      } else if (lead.interest === 'BUY' && property.salePrice) {
        if (lead.minPrice && property.salePrice < lead.minPrice) isMatch = false
        if (property.salePrice > lead.maxPrice) isMatch = false
      }
      
      // Verificar quartos, banheiros, área, localização (mesmo código)
      if (lead.minBedrooms && property.bedrooms < lead.minBedrooms) isMatch = false
      if (lead.maxBedrooms && property.bedrooms > lead.maxBedrooms) isMatch = false
      if (lead.minBathrooms && property.bathrooms < lead.minBathrooms) isMatch = false
      if (lead.maxBathrooms && property.bathrooms > lead.maxBathrooms) isMatch = false
      if (lead.minArea && property.area < lead.minArea) isMatch = false
      if (lead.maxArea && property.area > lead.maxArea) isMatch = false
      
      const preferredCities = JSON.parse(lead.preferredCities || '[]')
      const preferredStates = JSON.parse(lead.preferredStates || '[]')
      
      if (preferredCities.length > 0) {
        if (!preferredCities.includes(property.city)) {
          if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
            isMatch = false
          }
        }
      }
      
      if (isMatch) {
        // Verificar se já não foi notificado recentemente
        const existingNotification = await prisma.partnershipNotification.findFirst({
          where: {
            fromUserId: lead.userId,
            toUserId: userId,
            leadId: lead.id,
            propertyId: property.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
            }
          }
        })

        if (!existingNotification) {
          // Buscar telefone do usuário
          let userPhone = lead.user.phone
          if (!userPhone && lead.user.companyId) {
            const company = await prisma.company.findUnique({
              where: { id: lead.user.companyId },
              select: { phone: true }
            })
            userPhone = company?.phone || null
          }

          const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
          
          console.log(`🤝 Criando notificação de parceria: ${lead.user.name} → ${property.user.name}`)
          
          // Criar notificação de parceria
          await prisma.partnershipNotification.create({
            data: {
              fromUserId: lead.userId,
              toUserId: userId,
              leadId: lead.id,
              propertyId: property.id,
              fromUserName: lead.user.name || '',
              fromUserPhone: userPhone,
              fromUserEmail: lead.user.email || '',
              leadName: lead.name,
              leadPhone: lead.phone,
              propertyTitle: `${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m² - ${property.city}`,
              propertyPrice: targetPrice,
              matchType: lead.interest,
              sent: false
            }
          })
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar parcerias:', error)
  }
}

/**
 * Verifica matches quando um lead é criado
 */
export async function checkForMatches(leadId: string) {
  try {
    console.log(`🔍 Verificando matches para lead: ${leadId}`)
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!lead) {
      console.log('❌ Lead não encontrado')
      return
    }

    // Buscar propriedades do mesmo usuário
    const userProperties = await prisma.property.findMany({
      where: {
        AND: [
          { userId: lead.userId },
          { status: 'AVAILABLE' },
          { propertyType: lead.propertyType }
        ]
      }
    })

    // Buscar propriedades de outros usuários que aceitam parceria
    const partnershipProperties = await prisma.property.findMany({
      where: {
        AND: [
          { userId: { not: lead.userId } },
          { acceptsPartnership: true },
          { status: 'AVAILABLE' },
          { propertyType: lead.propertyType }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, companyId: true }
        }
      }
    })

    console.log(`🏠 ${userProperties.length} propriedades próprias + ${partnershipProperties.length} parcerias encontradas`)

    // Verificar matches com propriedades próprias
    for (const property of userProperties) {
      if (await isPropertyLeadMatch(property, lead)) {
        console.log(`✅ Match próprio: ${lead.name} x ${property.title}`)
        
        await prisma.leadNotification.create({
          data: {
            leadId: lead.id,
            propertyId: property.id,
            type: 'PROPERTY_MATCH',
            title: `Match Encontrado: ${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m²`,
            message: `A propriedade "${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m² - ${property.city}" faz match com o lead "${lead.name}"!`
          }
        })

        await prisma.lead.update({
          where: { id: lead.id },
          data: { matchedPropertyId: property.id }
        })
      }
    }

    // Verificar parcerias
    for (const property of partnershipProperties) {
      if (await isPropertyLeadMatch(property, lead)) {
        console.log(`🤝 Match parceria: ${lead.name} x ${property.title}`)
        
        // Mesmo código de criação de parceria de cima
        const existingNotification = await prisma.partnershipNotification.findFirst({
          where: {
            fromUserId: lead.userId,
            toUserId: property.userId,
            leadId: lead.id,
            propertyId: property.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })

        if (!existingNotification) {
          let userPhone = property.user.phone
          if (!userPhone && property.user.companyId) {
            const company = await prisma.company.findUnique({
              where: { id: property.user.companyId },
              select: { phone: true }
            })
            userPhone = company?.phone || null
          }

          const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
          
          await prisma.partnershipNotification.create({
            data: {
              fromUserId: lead.userId,
              toUserId: property.userId,
              leadId: lead.id,
              propertyId: property.id,
              fromUserName: lead.user.name || '',
              fromUserPhone: lead.user.phone,
              fromUserEmail: lead.user.email || '',
              leadName: lead.name,
              leadPhone: lead.phone,
              propertyTitle: `${property.title} - ${property.bedrooms}Q ${property.bathrooms}B ${property.area}m² - ${property.city}`,
              propertyPrice: targetPrice,
              matchType: lead.interest
            }
          })
        }
      }
    }
    
  } catch (error) {
    console.error('Erro ao verificar matches:', error)
  }
}

/**
 * Função auxiliar para verificar se propriedade e lead fazem match
 */
async function isPropertyLeadMatch(property: any, lead: any): Promise<boolean> {
  try {
    // Verificar disponibilidade
    const availableFor = JSON.parse(property.availableFor || '[]')
    
    if (lead.interest === 'RENT' && !availableFor.includes('RENT')) return false
    if (lead.interest === 'BUY' && !availableFor.includes('SALE')) return false
    
    // Verificar preço
    if (lead.interest === 'RENT' && property.rentPrice) {
      if (lead.minPrice && property.rentPrice < lead.minPrice) return false
      if (property.rentPrice > lead.maxPrice) return false
    } else if (lead.interest === 'BUY' && property.salePrice) {
      if (lead.minPrice && property.salePrice < lead.minPrice) return false
      if (property.salePrice > lead.maxPrice) return false
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
    
    // Verificar localização
    const preferredCities = JSON.parse(lead.preferredCities || '[]')
    const preferredStates = JSON.parse(lead.preferredStates || '[]')
    
    if (preferredCities.length > 0) {
      // Case insensitive comparison for cities
      const citiesLowerCase = preferredCities.map((city: string) => city.toLowerCase().trim())
      const propertyCityLower = property.city.toLowerCase().trim()
      
      if (!citiesLowerCase.includes(propertyCityLower)) {
        if (preferredStates.length === 0 || !preferredStates.includes(property.state)) {
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error('Erro ao verificar match:', error)
    return false
  }
}
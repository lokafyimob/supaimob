import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    console.log('🤝 Detectando oportunidades de parceria com raw SQL...')
    console.log('👤 Usuário atual:', user.id)
    
    // Buscar propriedades do usuário atual que aceitem parceria
    const propertiesQuery = `
      SELECT p.*, u.name as "ownerName", u.email as "ownerEmail", u.phone as "ownerPhone"
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" = $1 
        AND p."acceptsPartnership" = true 
        AND p.status = 'AVAILABLE'
    `
    const propertiesResult = await client.query(propertiesQuery, [user.id])
    const userProperties = propertiesResult.rows
    
    console.log(`🏠 ${userProperties.length} imóveis com parceria encontrados`)
    
    let totalPartnerships = 0
    
    // Para cada propriedade, buscar leads compatíveis de outros usuários
    for (const property of userProperties) {
      console.log(`🔍 Processando imóvel: ${property.title}`)
      
      const availableFor = JSON.parse(property.availableFor || '[]')
      
      // Construir query para buscar leads compatíveis
      let interestCondition = ''
      if (availableFor.includes('RENT') && availableFor.includes('SALE')) {
        interestCondition = `AND (l.interest = 'RENT' OR l.interest = 'BUY')`
      } else if (availableFor.includes('RENT')) {
        interestCondition = `AND l.interest = 'RENT'`
      } else if (availableFor.includes('SALE')) {
        interestCondition = `AND l.interest = 'BUY'`
      } else {
        interestCondition = `AND l.interest = 'RENT'` // fallback
      }
      
      const leadsQuery = `
        SELECT 
          l.*,
          u.name as "userName",
          u.email as "userEmail", 
          u.phone as "userPhone",
          u."companyId" as "userCompanyId"
        FROM leads l
        JOIN users u ON l."userId" = u.id
        WHERE l."userId" != $1
          AND l.status = 'ACTIVE'
          AND l."propertyType" = $2
          ${interestCondition}
      `
      
      const leadsResult = await client.query(leadsQuery, [user.id, property.propertyType])
      const matchingLeads = leadsResult.rows
      
      console.log(`👥 ${matchingLeads.length} leads compatíveis encontrados para ${property.title}`)
      
      // Verificar compatibilidade detalhada de cada lead
      for (const lead of matchingLeads) {
        const preferredCities = JSON.parse(lead.preferredCities || '[]')
        const preferredStates = JSON.parse(lead.preferredStates || '[]')
        
        // Verificações de compatibilidade
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
        
        if (!isMatch) continue
        
        // Verificar se notificação já existe (últimas 24h)
        const existingQuery = `
          SELECT id FROM partnership_notifications
          WHERE "fromUserId" = $1 
            AND "toUserId" = $2 
            AND "leadId" = $3 
            AND "propertyId" = $4
            AND "createdAt" > NOW() - INTERVAL '24 hours'
        `
        const existingResult = await client.query(existingQuery, [
          lead.userId, user.id, lead.id, property.id
        ])
        
        if (existingResult.rows.length === 0) {
          // Buscar telefone da empresa se usuário não tem telefone
          let userPhone = lead.userPhone
          if (!userPhone && lead.userCompanyId) {
            const companyQuery = `SELECT phone FROM companies WHERE id = $1`
            const companyResult = await client.query(companyQuery, [lead.userCompanyId])
            if (companyResult.rows.length > 0) {
              userPhone = companyResult.rows[0].phone
            }
          }
          
          // Criar notificação de parceria
          const targetPrice = lead.interest === 'RENT' ? property.rentPrice : (property.salePrice || 0)
          
          const insertQuery = `
            INSERT INTO partnership_notifications (
              id, "fromUserId", "toUserId", "leadId", "propertyId",
              "fromUserName", "fromUserPhone", "fromUserEmail",
              "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
              viewed, "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          `
          
          const notificationId = 'partner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          
          await client.query(insertQuery, [
            notificationId,
            lead.userId,     // Dono do lead
            user.id,         // Dono da propriedade (será notificado)
            lead.id,
            property.id,
            lead.userName || '',
            userPhone,
            lead.userEmail || '',
            lead.name,
            lead.phone,
            property.title,
            targetPrice,
            lead.interest,
            false            // não visualizada
          ])
          
          totalPartnerships++
          console.log(`✅ Parceria criada: ${lead.name} x ${property.title}`)
        }
      }
    }
    
    await client.end()
    
    console.log(`🎯 ${totalPartnerships} oportunidades de parceria criadas`)
    
    return NextResponse.json({
      success: true,
      partnerships: totalPartnerships,
      message: totalPartnerships > 0 
        ? `${totalPartnerships} oportunidades de parceria detectadas!`
        : 'Nenhuma oportunidade de parceria encontrada no momento.'
    })
    
  } catch (error) {
    console.error('❌ Erro ao detectar parcerias:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
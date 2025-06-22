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
    
    console.log('🤝 CRIANDO PARCERIAS: Preenchendo tabela partnership_notifications...')
    
    // 1. Buscar TODOS os leads ativos
    const leadsQuery = `
      SELECT l.*, u.name as "userName", u.email as "userEmail", u.phone as "userPhone"
      FROM leads l
      JOIN users u ON l."userId" = u.id  
      WHERE l.status = 'ACTIVE'
    `
    const leadsResult = await client.query(leadsQuery)
    
    // 2. Buscar TODAS as propriedades que aceitam parceria
    const propertiesQuery = `
      SELECT p.*, u.name as "ownerName", u.email as "ownerEmail", u.phone as "ownerPhone"
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."acceptsPartnership" = true 
        AND p.status = 'AVAILABLE'
    `
    const propertiesResult = await client.query(propertiesQuery)
    
    console.log(`👥 ${leadsResult.rows.length} leads ativos encontrados`)
    console.log(`🏠 ${propertiesResult.rows.length} propriedades que aceitam parceria`)
    
    let partnershipsCreated = 0
    
    // 3. Para cada lead, verificar matches com propriedades de OUTROS usuários
    for (const lead of leadsResult.rows) {
      for (const property of propertiesResult.rows) {
        
        // APENAS parcerias (usuários diferentes)
        if (lead.userId !== property.userId) {
          
          // Verificar match básico
          const isTypeMatch = lead.propertyType === property.propertyType
          const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
          const isPriceMatch = targetPrice && (!lead.maxPrice || targetPrice <= lead.maxPrice)
          
          if (isTypeMatch && isPriceMatch) {
            
            // Verificar se já existe notificação
            const existingQuery = `
              SELECT id FROM partnership_notifications 
              WHERE "fromUserId" = $1 
                AND "toUserId" = $2 
                AND "leadId" = $3 
                AND "propertyId" = $4
            `
            const existing = await client.query(existingQuery, [
              lead.userId, property.userId, lead.id, property.id
            ])
            
            if (existing.rows.length === 0) {
              // CRIAR NOTIFICAÇÃO DE PARCERIA
              const insertQuery = `
                INSERT INTO partnership_notifications (
                  id, "fromUserId", "toUserId", "leadId", "propertyId",
                  "fromUserName", "fromUserPhone", "fromUserEmail",
                  "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType"
                ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              `
              
              await client.query(insertQuery, [
                lead.userId,           // fromUserId (quem tem o lead)
                property.userId,       // toUserId (quem tem o imóvel)  
                lead.id,              // leadId
                property.id,          // propertyId
                lead.userName || 'Usuario',        // fromUserName
                lead.userPhone || null,       // fromUserPhone
                lead.userEmail || 'email@teste.com',       // fromUserEmail
                lead.name,            // leadName (nome do cliente)
                lead.phone,           // leadPhone (telefone do cliente)
                property.title,       // propertyTitle
                targetPrice,          // propertyPrice
                lead.interest         // matchType (RENT/BUY)
              ])
              
              partnershipsCreated++
              console.log(`✅ Parceria criada: ${lead.name} (${lead.userName}) ↔ ${property.title} (${property.ownerName})`)
            }
          }
        }
      }
    }
    
    await client.end()
    
    console.log(`🎉 CONCLUÍDO: ${partnershipsCreated} parcerias criadas na tabela partnership_notifications`)
    
    return NextResponse.json({
      success: true,
      message: `${partnershipsCreated} parcerias criadas com sucesso!`,
      partnershipsCreated,
      totalLeads: leadsResult.rows.length,
      totalProperties: propertiesResult.rows.length
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar parcerias:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
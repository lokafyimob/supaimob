// Auto Partnership Service - Criar parcerias automaticamente

export async function createPartnershipsForLead(leadId: string) {
  try {
    console.log('🤝 AUTO PARTNERSHIP: Criando parcerias para lead:', leadId)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // 1. Buscar o lead específico com dados do usuário
    const leadQuery = `
      SELECT l.*, u.name as "userName", u.email as "userEmail", u.phone as "userPhone"
      FROM leads l
      JOIN users u ON l."userId" = u.id  
      WHERE l.id = $1 AND l.status = 'ACTIVE'
    `
    const leadResult = await client.query(leadQuery, [leadId])
    
    if (leadResult.rows.length === 0) {
      console.log('❌ Lead não encontrado ou inativo:', leadId)
      await client.end()
      return { partnershipsCreated: 0 }
    }
    
    const lead = leadResult.rows[0]
    console.log(`👤 Lead encontrado: ${lead.name} (${lead.userName})`)
    
    // 2. Buscar propriedades de OUTROS usuários que aceitam parceria
    const propertiesQuery = `
      SELECT p.*, u.name as "ownerName", u.email as "ownerEmail", u.phone as "ownerPhone"
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."acceptsPartnership" = true 
        AND p.status = 'AVAILABLE'
        AND p."userId" != $1
    `
    const propertiesResult = await client.query(propertiesQuery, [lead.userId])
    
    console.log(`🏠 ${propertiesResult.rows.length} propriedades de outros usuários que aceitam parceria`)
    
    let partnershipsCreated = 0
    
    // 3. Para cada propriedade, verificar match
    for (const property of propertiesResult.rows) {
      
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
          console.log(`✅ Parceria AUTO criada: ${lead.name} (${lead.userName}) ↔ ${property.title} (${property.ownerName})`)
        } else {
          console.log(`⚠️ Parceria já existe: ${lead.name} ↔ ${property.title}`)
        }
      }
    }
    
    await client.end()
    
    console.log(`🎉 AUTO PARTNERSHIP CONCLUÍDO: ${partnershipsCreated} parcerias criadas para lead ${lead.name}`)
    
    return {
      partnershipsCreated,
      leadName: lead.name,
      totalPropertiesChecked: propertiesResult.rows.length
    }
    
  } catch (error) {
    console.error('❌ Erro no auto partnership service:', error)
    return { partnershipsCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createPartnershipsForProperty(propertyId: string) {
  try {
    console.log('🤝 AUTO PARTNERSHIP: Criando parcerias para propriedade:', propertyId)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // 1. Buscar a propriedade específica com dados do usuário
    const propertyQuery = `
      SELECT p.*, u.name as "ownerName", u.email as "ownerEmail", u.phone as "ownerPhone"
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p.id = $1 AND p."acceptsPartnership" = true AND p.status = 'AVAILABLE'
    `
    const propertyResult = await client.query(propertyQuery, [propertyId])
    
    if (propertyResult.rows.length === 0) {
      console.log('❌ Propriedade não encontrada ou não aceita parceria:', propertyId)
      await client.end()
      return { partnershipsCreated: 0 }
    }
    
    const property = propertyResult.rows[0]
    console.log(`🏠 Propriedade encontrada: ${property.title} (${property.ownerName})`)
    
    // 2. Buscar leads de OUTROS usuários
    const leadsQuery = `
      SELECT l.*, u.name as "userName", u.email as "userEmail", u.phone as "userPhone"
      FROM leads l
      JOIN users u ON l."userId" = u.id  
      WHERE l.status = 'ACTIVE'
        AND l."userId" != $1
    `
    const leadsResult = await client.query(leadsQuery, [property.userId])
    
    console.log(`👥 ${leadsResult.rows.length} leads de outros usuários`)
    
    let partnershipsCreated = 0
    
    // 3. Para cada lead, verificar match
    for (const lead of leadsResult.rows) {
      
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
          console.log(`✅ Parceria AUTO criada: ${lead.name} (${lead.userName}) ↔ ${property.title} (${property.ownerName})`)
        } else {
          console.log(`⚠️ Parceria já existe: ${lead.name} ↔ ${property.title}`)
        }
      }
    }
    
    await client.end()
    
    console.log(`🎉 AUTO PARTNERSHIP CONCLUÍDO: ${partnershipsCreated} parcerias criadas para propriedade ${property.title}`)
    
    return {
      partnershipsCreated,
      propertyTitle: property.title,
      totalLeadsChecked: leadsResult.rows.length
    }
    
  } catch (error) {
    console.error('❌ Erro no auto partnership service para propriedade:', error)
    return { partnershipsCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
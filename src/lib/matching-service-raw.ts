/**
 * Raw SQL version of matching service to avoid Prisma issues
 */

export async function checkForMatchesRaw(leadId: string) {
  try {
    console.log(`🔍 Verificando matches para lead: ${leadId} (SQL RAW)`)
    console.log('🔧 DATABASE_URL definida:', !!process.env.DATABASE_URL)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    console.log('✅ Conectado ao banco de dados para matching')
    
    // Get lead details
    const leadQuery = `
      SELECT l.*, u.name as userName, u.email as userEmail, u.phone as userPhone
      FROM leads l
      JOIN users u ON l."userId" = u.id
      WHERE l.id = $1
    `
    const leadResult = await client.query(leadQuery, [leadId])
    
    if (leadResult.rows.length === 0) {
      console.log('❌ Lead não encontrado')
      await client.end()
      return
    }
    
    const lead = leadResult.rows[0]
    console.log(`📋 Lead: ${lead.name} - ${lead.interest} - ${lead.propertyType}`)
    
    // Find matching properties from the same user
    const userPropertiesQuery = `
      SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" = $1 
        AND p.status = 'AVAILABLE'
        AND p."propertyType" = $2
        AND (
          (p."rentPrice" IS NOT NULL AND $3 = 'RENT') OR
          (p."salePrice" IS NOT NULL AND $3 = 'BUY')
        )
        AND (
          ($3 = 'RENT' AND p."rentPrice" BETWEEN $4 AND $5) OR
          ($3 = 'BUY' AND p."salePrice" BETWEEN $4 AND $5)
        )
    `
    
    console.log('🔍 Parâmetros da busca:', {
      userId: lead.userId,
      propertyType: lead.propertyType,
      interest: lead.interest,
      minPrice: lead.minPrice || 0,
      maxPrice: lead.maxPrice || 999999999
    })
    
    const userPropertiesResult = await client.query(userPropertiesQuery, [
      lead.userId,
      lead.propertyType,
      lead.interest,
      lead.minPrice || 0,
      lead.maxPrice || 999999999
    ])
    
    console.log(`🏠 Propriedades do usuário encontradas: ${userPropertiesResult.rows.length}`)
    if (userPropertiesResult.rows.length > 0) {
      console.log('📋 Propriedades encontradas:', userPropertiesResult.rows.map(p => ({
        id: p.id,
        title: p.title,
        rentPrice: p.rentPrice,
        salePrice: p.salePrice,
        propertyType: p.propertyType,
        status: p.status
      })))
    } else {
      // Verificar se existem propriedades do usuário (sem filtros)
      const allUserPropsQuery = `SELECT COUNT(*) as count FROM properties WHERE "userId" = $1`
      const allUserPropsResult = await client.query(allUserPropsQuery, [lead.userId])
      console.log(`📊 Total de propriedades do usuário (sem filtros): ${allUserPropsResult.rows[0].count}`)
    }
    
    // Create notifications for matches
    let matchCount = 0
    
    for (const property of userPropertiesResult.rows) {
      // Check if notification already exists
      const existingNotificationQuery = `
        SELECT id FROM lead_notifications 
        WHERE "leadId" = $1 AND "propertyId" = $2
      `
      const existingResult = await client.query(existingNotificationQuery, [leadId, property.id])
      
      if (existingResult.rows.length === 0) {
        // Create notification
        const notificationId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const createNotificationQuery = `
          INSERT INTO lead_notifications (
            id, "leadId", "propertyId", type, title, message, "isRead", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `
        
        const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
        const title = `Match Encontrado: ${property.title}`
        const message = `A propriedade "${property.title}" na ${property.city} faz match com o lead "${lead.name}"! Preço: R$ ${price.toLocaleString('pt-BR')}`
        
        await client.query(createNotificationQuery, [
          notificationId,
          leadId,
          property.id,
          'PROPERTY_MATCH',
          title,
          message,
          false
        ])
        
        console.log(`✅ Notificação criada: ${title}`)
        matchCount++
        
        // Update lead with matched property
        const updateLeadQuery = `
          UPDATE leads SET "matchedPropertyId" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `
        await client.query(updateLeadQuery, [property.id, leadId])
      }
    }
    
    // Find partnership properties (from other users)
    const partnershipPropertiesQuery = `
      SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" != $1 
        AND p."acceptsPartnership" = true
        AND p.status = 'AVAILABLE'
        AND p."propertyType" = $2
        AND (
          (p."rentPrice" IS NOT NULL AND $3 = 'RENT') OR
          (p."salePrice" IS NOT NULL AND $3 = 'BUY')
        )
        AND (
          ($3 = 'RENT' AND p."rentPrice" BETWEEN $4 AND $5) OR
          ($3 = 'BUY' AND p."salePrice" BETWEEN $4 AND $5)
        )
      LIMIT 10
    `
    
    const partnershipResult = await client.query(partnershipPropertiesQuery, [
      lead.userId,
      lead.propertyType,
      lead.interest,
      lead.minPrice || 0,
      lead.maxPrice || 999999999
    ])
    
    console.log(`🤝 Propriedades para parceria encontradas: ${partnershipResult.rows.length}`)
    
    // Create partnership notifications
    for (const property of partnershipResult.rows) {
      // Check if partnership notification already exists
      const existingPartnershipQuery = `
        SELECT id FROM partnership_notifications 
        WHERE "fromUserId" = $1 AND "toUserId" = $2 AND "leadId" = $3 AND "propertyId" = $4
        AND "createdAt" > NOW() - INTERVAL '24 hours'
      `
      const existingPartnership = await client.query(existingPartnershipQuery, [
        lead.userId, property.userId, leadId, property.id
      ])
      
      if (existingPartnership.rows.length === 0) {
        const partnershipId = 'partner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const createPartnershipQuery = `
          INSERT INTO partnership_notifications (
            id, "fromUserId", "toUserId", "leadId", "propertyId", 
            "fromUserName", "fromUserPhone", "fromUserEmail",
            "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        `
        
        await client.query(createPartnershipQuery, [
          partnershipId,
          lead.userId,
          property.userId,
          leadId,
          property.id,
          lead.userName,
          lead.userPhone,
          lead.userEmail,
          lead.name,
          lead.phone,
          property.title,
          lead.interest === 'RENT' ? property.rentPrice : property.salePrice,
          lead.interest
        ])
        
        console.log(`🤝 Parceria criada: ${lead.name} x ${property.title}`)
        matchCount++
      }
    }
    
    await client.end()
    
    console.log(`✅ Matching concluído: ${matchCount} matches/parcerias criados`)
    return { matchCount, userMatches: userPropertiesResult.rows.length, partnershipMatches: partnershipResult.rows.length }
    
  } catch (error) {
    console.error('❌ Erro no matching:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
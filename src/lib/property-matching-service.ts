/**
 * Raw SQL version of property matching service
 * Executes when properties are created/updated to find matching leads
 */

export async function checkForPropertyMatches(propertyId: string) {
  try {
    console.log(`🔍 Verificando matches para propriedade: ${propertyId} (SQL RAW)`)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    console.log('✅ Conectado ao banco para property matching')
    
    // Get property details
    const propertyQuery = `
      SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p.id = $1
    `
    const propertyResult = await client.query(propertyQuery, [propertyId])
    
    if (propertyResult.rows.length === 0) {
      console.log('❌ Propriedade não encontrada')
      await client.end()
      return
    }
    
    const property = propertyResult.rows[0]
    console.log(`🏠 Propriedade: ${property.title} - ${property.propertyType} - R$ ${property.rentPrice}/${property.salePrice}`)
    
    // Find matching leads from the same user (direct matches)
    const userLeadsQuery = `
      SELECT l.*, u.name as userName, u.email as userEmail, u.phone as userPhone
      FROM leads l
      JOIN users u ON l."userId" = u.id
      WHERE l."userId" = $1 
        AND l.status = 'ACTIVE'
        AND l."propertyType" = $2
        AND (
          (l.interest = 'RENT' AND $3 > 0 AND $3 BETWEEN COALESCE(l."minPrice", 0) AND l."maxPrice") OR
          (l.interest = 'BUY' AND $4 > 0 AND $4 BETWEEN COALESCE(l."minPrice", 0) AND l."maxPrice")
        )
    `
    
    console.log('🔍 Parâmetros da busca de leads:', {
      userId: property.userId,
      propertyType: property.propertyType,
      rentPrice: property.rentPrice,
      salePrice: property.salePrice
    })
    
    const userLeadsResult = await client.query(userLeadsQuery, [
      property.userId,
      property.propertyType,
      property.rentPrice || 0,
      property.salePrice || 0
    ])
    
    console.log(`👥 Leads do usuário encontrados: ${userLeadsResult.rows.length}`)
    if (userLeadsResult.rows.length > 0) {
      console.log('📋 Leads encontrados:', userLeadsResult.rows.map(l => ({
        id: l.id,
        name: l.name,
        interest: l.interest,
        minPrice: l.minPrice,
        maxPrice: l.maxPrice
      })))
    } else {
      // Verificar se existem leads do usuário (sem filtros)
      const allUserLeadsQuery = `SELECT COUNT(*) as count FROM leads WHERE "userId" = $1`
      const allUserLeadsResult = await client.query(allUserLeadsQuery, [property.userId])
      console.log(`📊 Total de leads do usuário (sem filtros): ${allUserLeadsResult.rows[0].count}`)
    }
    
    let matchCount = 0
    
    // Create notifications for direct matches (same user)
    for (const lead of userLeadsResult.rows) {
      // Check if notification already exists
      const existingNotificationQuery = `
        SELECT id FROM lead_notifications 
        WHERE "leadId" = $1 AND "propertyId" = $2
      `
      const existingResult = await client.query(existingNotificationQuery, [lead.id, propertyId])
      
      if (existingResult.rows.length === 0) {
        // Create notification
        const notificationId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
        const title = `Match Encontrado: ${property.title}`
        const message = `A propriedade "${property.title}" na ${property.city} faz match com o lead "${lead.name}"! Preço: R$ ${price.toLocaleString('pt-BR')}`
        
        const createNotificationQuery = `
          INSERT INTO lead_notifications (
            id, "leadId", "propertyId", type, title, message, sent, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `
        
        try {
          await client.query(createNotificationQuery, [
            notificationId,
            lead.id,
            propertyId,
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
          await client.query(updateLeadQuery, [propertyId, lead.id])
          
        } catch (notificationError) {
          console.error('❌ Erro ao criar notificação:', notificationError)
        }
      }
    }
    
    // Find partnership leads (from other users) if property accepts partnership
    if (property.acceptsPartnership) {
      const partnershipLeadsQuery = `
        SELECT l.*, u.name as userName, u.email as userEmail, u.phone as userPhone
        FROM leads l
        JOIN users u ON l."userId" = u.id
        WHERE l."userId" != $1 
          AND l.status = 'ACTIVE'
          AND l."propertyType" = $2
          AND (
            (l.interest = 'RENT' AND $3 > 0 AND $3 BETWEEN COALESCE(l."minPrice", 0) AND l."maxPrice") OR
            (l.interest = 'BUY' AND $4 > 0 AND $4 BETWEEN COALESCE(l."minPrice", 0) AND l."maxPrice")
          )
        LIMIT 10
      `
      
      const partnershipResult = await client.query(partnershipLeadsQuery, [
        property.userId,
        property.propertyType,
        property.rentPrice || 0,
        property.salePrice || 0
      ])
      
      console.log(`🤝 Leads para parceria encontrados: ${partnershipResult.rows.length}`)
      
      // Create partnership notifications
      for (const lead of partnershipResult.rows) {
        // Check if partnership notification already exists
        const existingPartnershipQuery = `
          SELECT id FROM partnership_notifications 
          WHERE "fromUserId" = $1 AND "toUserId" = $2 AND "leadId" = $3 AND "propertyId" = $4
          AND "createdAt" > NOW() - INTERVAL '24 hours'
        `
        const existingPartnership = await client.query(existingPartnershipQuery, [
          lead.userId, property.userId, lead.id, propertyId
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
          
          const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
          
          await client.query(createPartnershipQuery, [
            partnershipId,
            lead.userId,
            property.userId,
            lead.id,
            propertyId,
            lead.userName,
            lead.userPhone,
            lead.userEmail,
            lead.name,
            lead.phone,
            property.title,
            price,
            lead.interest
          ])
          
          console.log(`🤝 Parceria criada: ${lead.name} x ${property.title}`)
          matchCount++
        }
      }
    }
    
    await client.end()
    
    console.log(`✅ Property matching concluído: ${matchCount} matches/parcerias criados`)
    return { matchCount, userMatches: userLeadsResult.rows.length, partnershipMatches: property.acceptsPartnership ? 10 : 0 }
    
  } catch (error) {
    console.error('❌ Erro no property matching:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
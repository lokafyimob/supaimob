/**
 * Serviço que detecta mudanças em leads e atualiza automaticamente
 * as tabelas lead_notifications e partnership_notifications
 */

export async function notifyLeadChanges(leadId: string, changeType: 'created' | 'updated' | 'deleted') {
  try {
    console.log(`🔔 Detectando mudanças no lead: ${leadId} (${changeType})`)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // 1. Buscar dados do lead
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
      return { notificationsCreated: 0 }
    }
    
    const lead = leadResult.rows[0]
    console.log(`👤 Lead: ${lead.name} - ${lead.interest} - ${lead.propertyType}`)
    console.log(`🏦 Lead precisa de financiamento: ${lead.needsFinancing}`)
    console.log(`📊 Status do lead: ${lead.status}`)
    
    let notificationsCreated = 0
    
    // 2. BUSCAR PROPRIEDADES QUE FAZEM MATCH COM ESTE LEAD
    
    // A) Propriedades do mesmo usuário (lead_notifications)
    const userPropertiesQuery = `
      SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" = $1 
        AND p.status = 'AVAILABLE'
        AND p."propertyType" = $2
        AND (
          (p."rentPrice" IS NOT NULL AND $3 = 'RENT' AND p."rentPrice" BETWEEN COALESCE($4, 0) AND $5) OR
          (p."salePrice" IS NOT NULL AND $3 = 'BUY' AND p."salePrice" BETWEEN COALESCE($4, 0) AND $5)
        )
        AND (
          -- Se lead precisa de financiamento, propriedade deve aceitar
          $6 = false OR 
          ($6 = true AND p."acceptsFinancing" = true)
        )
    `
    
    const userPropertiesResult = await client.query(userPropertiesQuery, [
      lead.userId,
      lead.propertyType,
      lead.interest,
      lead.minPrice || 0,
      lead.maxPrice || 999999999,
      lead.needsFinancing || false
    ])
    
    console.log(`🏠 Propriedades do mesmo usuário que fazem match: ${userPropertiesResult.rows.length}`)
    
    // Criar/atualizar lead_notifications
    for (const property of userPropertiesResult.rows) {
      // Verificar se já existe notificação
      const existingQuery = `
        SELECT id, "createdAt" FROM lead_notifications 
        WHERE "leadId" = $1 AND "propertyId" = $2
      `
      const existingResult = await client.query(existingQuery, [leadId, property.id])
      
      const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
      const title = `${changeType === 'created' ? 'Novo Lead' : 'Lead Atualizado'}: ${lead.name}`
      
      // Informações detalhadas sobre financiamento e status
      const financingInfo = lead.needsFinancing ? 
        (property.acceptsFinancing ? '✅ Propriedade aceita financiamento' : '❌ Propriedade não aceita financiamento') : 
        ''
      const statusInfo = `Status: ${property.status}`
      
      const message = `Lead "${lead.name}" ${changeType === 'created' ? 'foi criado e' : 'foi atualizado e'} faz match com a propriedade "${property.title}" em ${property.city}! 
💰 Preço: R$ ${price?.toLocaleString('pt-BR') || 'N/A'}
📊 ${statusInfo}
${financingInfo ? `🏦 ${financingInfo}` : ''}`
      
      if (existingResult.rows.length === 0) {
        // Criar nova notificação
        const notificationId = 'lead_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const createQuery = `
          INSERT INTO lead_notifications (
            id, "leadId", "propertyId", type, title, message, sent, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `
        
        await client.query(createQuery, [
          notificationId,
          leadId,
          property.id,
          'PROPERTY_MATCH',
          title,
          message,
          false
        ])
        
        console.log(`✅ Nova lead_notification criada: ${title}`)
        notificationsCreated++
        
      } else if (changeType === 'updated') {
        // Atualizar notificação existente (manter createdAt original, mas resetar sent)
        const updateQuery = `
          UPDATE lead_notifications 
          SET title = $1, message = $2, sent = false, "sentAt" = NULL
          WHERE "leadId" = $3 AND "propertyId" = $4
        `
        
        await client.query(updateQuery, [title, message, leadId, property.id])
        console.log(`🔄 lead_notification atualizada: ${title}`)
        notificationsCreated++
      }
    }
    
    // B) Propriedades de outros usuários (partnership_notifications) - SE o lead está ativo
    if (lead.status === 'ACTIVE') {
      const partnershipPropertiesQuery = `
        SELECT p.*, u.name as ownerName, u.email as ownerEmail, u.phone as ownerPhone
        FROM properties p
        JOIN users u ON p."userId" = u.id
        WHERE p."userId" != $1 
          AND p."acceptsPartnership" = true
          AND p.status = 'AVAILABLE'
          AND p."propertyType" = $2
          AND (
            (p."rentPrice" IS NOT NULL AND $3 = 'RENT' AND p."rentPrice" BETWEEN COALESCE($4, 0) AND $5) OR
            (p."salePrice" IS NOT NULL AND $3 = 'BUY' AND p."salePrice" BETWEEN COALESCE($4, 0) AND $5)
          )
          AND (
            -- Se lead precisa de financiamento, propriedade deve aceitar
            $6 = false OR 
            ($6 = true AND p."acceptsFinancing" = true)
          )
        LIMIT 10
      `
      
      const partnershipResult = await client.query(partnershipPropertiesQuery, [
        lead.userId,
        lead.propertyType,
        lead.interest,
        lead.minPrice || 0,
        lead.maxPrice || 999999999,
        lead.needsFinancing || false
      ])
      
      console.log(`🤝 Propriedades de outros usuários para parceria: ${partnershipResult.rows.length}`)
      
      // Criar/atualizar partnership_notifications
      for (const property of partnershipResult.rows) {
        // Verificar se já existe parceria nas últimas 24h
        const existingPartnershipQuery = `
          SELECT id, "createdAt" FROM partnership_notifications 
          WHERE "fromUserId" = $1 AND "toUserId" = $2 AND "leadId" = $3 AND "propertyId" = $4
          AND "createdAt" > NOW() - INTERVAL '24 hours'
        `
        const existingPartnership = await client.query(existingPartnershipQuery, [
          lead.userId, property.userId, leadId, property.id
        ])
        
        if (existingPartnership.rows.length === 0) {
          // Criar nova parceria
          const partnershipId = 'lead_partner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          
          const createPartnershipQuery = `
            INSERT INTO partnership_notifications (
              id, "fromUserId", "toUserId", "leadId", "propertyId", 
              "fromUserName", "fromUserPhone", "fromUserEmail",
              "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
              viewed, "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          `
          
          const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
          
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
            price,
            lead.interest,
            false
          ])
          
          console.log(`🤝 Nova partnership_notification criada: ${lead.name} x ${property.title}`)
          notificationsCreated++
        }
      }
    }
    
    await client.end()
    
    console.log(`✅ ${notificationsCreated} notificações criadas/atualizadas para o lead ${lead.name}`)
    return { notificationsCreated, leadName: lead.name }
    
  } catch (error) {
    console.error('❌ Erro ao notificar mudanças no lead:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
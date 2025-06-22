/**
 * Serviço que detecta mudanças em propriedades e atualiza automaticamente
 * as tabelas lead_notifications e partnership_notifications
 */

export async function notifyPropertyChanges(propertyId: string, changeType: 'created' | 'updated' | 'deleted') {
  try {
    console.log(`🔔 Detectando mudanças na propriedade: ${propertyId} (${changeType})`)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // 1. Buscar dados da propriedade
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
      return { notificationsCreated: 0 }
    }
    
    const property = propertyResult.rows[0]
    console.log(`🏠 Propriedade: ${property.title} - ${property.propertyType}`)
    
    let notificationsCreated = 0
    
    // 2. BUSCAR LEADS QUE FAZEM MATCH COM ESTA PROPRIEDADE
    
    // A) Leads do mesmo usuário (lead_notifications)
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
        AND (
          -- 🔥 LÓGICA CORRIGIDA: Se lead precisa financiamento E interesse é COMPRA, propriedade DEVE aceitar
          (l.interest = 'RENT') OR
          (l.interest = 'BUY' AND l."needsFinancing" = false) OR 
          (l.interest = 'BUY' AND l."needsFinancing" = true AND $5 = true)
        )
    `
    
    const userLeadsResult = await client.query(userLeadsQuery, [
      property.userId,
      property.propertyType,
      property.rentPrice || 0,
      property.salePrice || 0,
      property.acceptsFinancing || false
    ])
    
    console.log(`👤 Leads do mesmo usuário que fazem match: ${userLeadsResult.rows.length}`)
    console.log(`🏦 Propriedade aceita financiamento: ${property.acceptsFinancing}`)
    console.log(`📊 Status da propriedade: ${property.status}`)
    console.log(`🤝 Aceita parceria: ${property.acceptsPartnership}`)
    
    // Criar/atualizar lead_notifications
    for (const lead of userLeadsResult.rows) {
      // Verificar se já existe notificação
      const existingQuery = `
        SELECT id, "createdAt" FROM lead_notifications 
        WHERE "leadId" = $1 AND "propertyId" = $2
      `
      const existingResult = await client.query(existingQuery, [lead.id, propertyId])
      
      const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
      const title = `${changeType === 'created' ? 'Novo Match' : 'Match Atualizado'}: ${property.title}`
      
      // Informações detalhadas sobre financiamento e status
      const financingInfo = lead.needsFinancing ? 
        (property.acceptsFinancing ? '✅ Aceita financiamento' : '❌ Não aceita financiamento') : 
        ''
      const statusInfo = `Status: ${property.status}`
      
      const message = `Propriedade "${property.title}" em ${property.city} ${changeType === 'created' ? 'foi adicionada e' : 'foi atualizada e'} faz match com o lead "${lead.name}"! 
💰 Preço: R$ ${price?.toLocaleString('pt-BR') || 'N/A'}
📊 ${statusInfo}
${financingInfo ? `🏦 ${financingInfo}` : ''}`
      
      if (existingResult.rows.length === 0) {
        // Criar nova notificação
        const notificationId = 'prop_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const createQuery = `
          INSERT INTO lead_notifications (
            id, "leadId", "propertyId", type, title, message, sent, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `
        
        await client.query(createQuery, [
          notificationId,
          lead.id,
          propertyId,
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
        
        await client.query(updateQuery, [title, message, lead.id, propertyId])
        console.log(`🔄 lead_notification atualizada: ${title}`)
        notificationsCreated++
      }
    }
    
    // B) Leads de outros usuários (partnership_notifications) - SE a propriedade aceita parceria E está disponível
    if (property.acceptsPartnership && property.status === 'AVAILABLE') {
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
          AND (
            -- 🔥 LÓGICA CORRIGIDA: Se lead precisa financiamento E interesse é COMPRA, propriedade DEVE aceitar
            (l.interest = 'RENT') OR
            (l.interest = 'BUY' AND l."needsFinancing" = false) OR 
            (l.interest = 'BUY' AND l."needsFinancing" = true AND $5 = true)
          )
        LIMIT 10
      `
      
      const partnershipResult = await client.query(partnershipLeadsQuery, [
        property.userId,
        property.propertyType,
        property.rentPrice || 0,
        property.salePrice || 0,
        property.acceptsFinancing || false
      ])
      
      console.log(`🤝 Leads de outros usuários para parceria: ${partnershipResult.rows.length}`)
      
      // Criar/atualizar partnership_notifications
      for (const lead of partnershipResult.rows) {
        // Verificar se já existe parceria (sem limite de tempo para ULTRAPHINK)
        const existingPartnershipQuery = `
          SELECT id, "createdAt" FROM partnership_notifications 
          WHERE "fromUserId" = $1 AND "toUserId" = $2 AND "leadId" = $3 AND "propertyId" = $4
        `
        const existingPartnership = await client.query(existingPartnershipQuery, [
          lead.userId, property.userId, lead.id, propertyId
        ])
        
        const price = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
        
        if (existingPartnership.rows.length === 0) {
          // Criar nova parceria
          const partnershipId = 'prop_partner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
          
          const createPartnershipQuery = `
            INSERT INTO partnership_notifications (
              id, "fromUserId", "toUserId", "leadId", "propertyId", 
              "fromUserName", "fromUserPhone", "fromUserEmail",
              "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
              viewed, "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          `
          
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
            lead.interest,
            false
          ])
          
          console.log(`🤝 Nova partnership_notification criada: ${lead.name} x ${property.title}`)
          notificationsCreated++
          
        } else {
          // 🔥 ULTRAPHINK: ATUALIZAR TODOS OS CAMPOS da parceria existente
          const updatePartnershipQuery = `
            UPDATE partnership_notifications 
            SET 
              "fromUserName" = $1,
              "fromUserPhone" = $2, 
              "fromUserEmail" = $3,
              "leadName" = $4,
              "leadPhone" = $5,
              "propertyTitle" = $6,
              "propertyPrice" = $7,
              "matchType" = $8,
              viewed = false
            WHERE "fromUserId" = $9 AND "toUserId" = $10 AND "leadId" = $11 AND "propertyId" = $12
          `
          
          await client.query(updatePartnershipQuery, [
            lead.userName,
            lead.userPhone,
            lead.userEmail,
            lead.name,
            lead.phone,
            property.title,
            price,
            lead.interest,
            lead.userId,
            property.userId,
            lead.id,
            propertyId
          ])
          
          console.log(`🔄 ULTRAPHINK: Partnership_notification ATUALIZADA: ${lead.name} x ${property.title}`)
          notificationsCreated++
        }
      }
    }
    
    // 3. LÓGICA ESPECIAL: Se propriedade NÃO aceita financiamento, REMOVER leads que precisam
    if (!property.acceptsFinancing) {
      console.log('🚫 Propriedade NÃO aceita financiamento - removendo leads incompatíveis...')
      
      // Remover lead_notifications de leads que precisam de financiamento
      const removeIncompatibleLeadsQuery = `
        DELETE FROM lead_notifications 
        WHERE "propertyId" = $1 
          AND "leadId" IN (
            SELECT l.id FROM leads l 
            WHERE l."needsFinancing" = true
          )
      `
      const removedLeads = await client.query(removeIncompatibleLeadsQuery, [propertyId])
      console.log(`🗑️ ${removedLeads.rowCount} lead_notifications removidas (leads precisam financiamento)`)
      
      // Remover partnership_notifications de leads que precisam de financiamento
      const removeIncompatiblePartnershipsQuery = `
        DELETE FROM partnership_notifications 
        WHERE "propertyId" = $1 
          AND "leadId" IN (
            SELECT l.id FROM leads l 
            WHERE l."needsFinancing" = true
          )
      `
      const removedPartnerships = await client.query(removeIncompatiblePartnershipsQuery, [propertyId])
      console.log(`🗑️ ${removedPartnerships.rowCount} partnership_notifications removidas (leads precisam financiamento)`)
    }
    
    await client.end()
    
    console.log(`✅ ${notificationsCreated} notificações criadas/atualizadas para a propriedade ${property.title}`)
    return { notificationsCreated, propertyTitle: property.title }
    
  } catch (error) {
    console.error('❌ Erro ao notificar mudanças na propriedade:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
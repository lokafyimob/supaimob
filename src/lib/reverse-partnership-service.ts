/**
 * Detecção de parcerias reversas quando um lead é criado
 * Busca propriedades de outros usuários que façam match com o lead criado
 */

export async function detectReversePartnerships(leadId: string) {
  try {
    console.log(`🤝 Detectando parcerias reversas para lead: ${leadId}`)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Buscar dados do lead criado
    const leadQuery = `
      SELECT l.*, u.name as "userName", u.email as "userEmail", u.phone as "userPhone"
      FROM leads l
      JOIN users u ON l."userId" = u.id
      WHERE l.id = $1
    `
    const leadResult = await client.query(leadQuery, [leadId])
    
    if (leadResult.rows.length === 0) {
      console.log('❌ Lead não encontrado')
      await client.end()
      return { partnershipsCreated: 0 }
    }
    
    const lead = leadResult.rows[0]
    console.log(`👤 Lead: ${lead.name} - ${lead.interest} - ${lead.propertyType}`)
    
    // Buscar propriedades de outros usuários que aceitem parceria e façam match
    const propertiesQuery = `
      SELECT p.*, u.name as "ownerName", u.email as "ownerEmail", u.phone as "ownerPhone"
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" != $1
        AND p."acceptsPartnership" = true
        AND p.status = 'AVAILABLE'
        AND p."propertyType" = $2
    `
    
    const propertiesResult = await client.query(propertiesQuery, [lead.userId, lead.propertyType])
    const availableProperties = propertiesResult.rows
    
    console.log(`🏠 ${availableProperties.length} propriedades com parceria encontradas`)
    
    let partnershipsCreated = 0
    
    // Verificar compatibilidade de cada propriedade
    for (const property of availableProperties) {
      const availableFor = JSON.parse(property.availableFor || '[]')
      
      // Verificar se propriedade está disponível para o interesse do lead
      let isAvailable = false
      if (lead.interest === 'RENT' && availableFor.includes('RENT')) {
        isAvailable = true
      } else if (lead.interest === 'BUY' && availableFor.includes('SALE')) {
        isAvailable = true
      }
      
      if (!isAvailable) continue
      
      // Verificar compatibilidade de preço
      let isMatch = true
      const propertyPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
      
      if (!propertyPrice || propertyPrice <= 0) continue
      
      if (lead.minPrice && propertyPrice < lead.minPrice) isMatch = false
      if (propertyPrice > lead.maxPrice) isMatch = false
      
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
      
      if (!isMatch) continue
      
      // Verificar se notificação já existe
      const existingQuery = `
        SELECT id FROM partnership_notifications
        WHERE "fromUserId" = $1 
          AND "toUserId" = $2 
          AND "leadId" = $3 
          AND "propertyId" = $4
          AND "createdAt" > NOW() - INTERVAL '24 hours'
      `
      const existingResult = await client.query(existingQuery, [
        lead.userId, property.userId, leadId, property.id
      ])
      
      if (existingResult.rows.length === 0) {
        // Criar notificação de parceria reversa
        const notificationId = 'reverse_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        
        const insertQuery = `
          INSERT INTO partnership_notifications (
            id, "fromUserId", "toUserId", "leadId", "propertyId",
            "fromUserName", "fromUserPhone", "fromUserEmail",
            "leadName", "leadPhone", "propertyTitle", "propertyPrice", "matchType",
            viewed, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        `
        
        await client.query(insertQuery, [
          notificationId,
          lead.userId,        // Dono do lead
          property.userId,    // Dono da propriedade (será notificado)
          leadId,
          property.id,
          lead.userName || '',
          lead.userPhone,
          lead.userEmail || '',
          lead.name,
          lead.phone,
          property.title,
          propertyPrice,
          lead.interest,
          false               // não visualizada
        ])
        
        partnershipsCreated++
        console.log(`✅ Parceria reversa criada: ${lead.name} x ${property.title} (para ${property.ownerName})`)
      }
    }
    
    await client.end()
    
    console.log(`🎯 ${partnershipsCreated} parcerias reversas criadas`)
    return { partnershipsCreated }
    
  } catch (error) {
    console.error('❌ Erro na detecção de parceria reversa:', error)
    return { partnershipsCreated: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    console.log('🔍 DEBUGGING: Testando criação de parcerias...')
    
    // 1. Verificar quantas propriedades aceitam parceria
    const partnershipPropsQuery = `
      SELECT COUNT(*) as count, "userId", u.name as userName
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."acceptsPartnership" = true 
        AND p.status = 'AVAILABLE'
      GROUP BY p."userId", u.name
    `
    const partnershipPropsResult = await client.query(partnershipPropsQuery)
    
    // 2. Verificar quantos leads ativos existem
    const activeLeadsQuery = `
      SELECT COUNT(*) as count, "userId", u.name as userName
      FROM leads l
      JOIN users u ON l."userId" = u.id
      WHERE l.status = 'ACTIVE'
      GROUP BY l."userId", u.name
    `
    const activeLeadsResult = await client.query(activeLeadsQuery)
    
    // 3. Verificar leads do usuário atual
    const userLeadsQuery = `
      SELECT id, name, interest, "propertyType", "maxPrice", "needsFinancing"
      FROM leads 
      WHERE "userId" = $1 AND status = 'ACTIVE'
    `
    const userLeadsResult = await client.query(userLeadsQuery, [user.id])
    
    // 4. Verificar propriedades de outros usuários que aceitam parceria
    const otherPropsQuery = `
      SELECT p.id, p.title, p."rentPrice", p."salePrice", p."propertyType", 
             p."acceptsFinancing", u.name as ownerName
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" != $1 
        AND p."acceptsPartnership" = true 
        AND p.status = 'AVAILABLE'
    `
    const otherPropsResult = await client.query(otherPropsQuery, [user.id])
    
    // 5. Verificar se já existem parcerias
    const existingPartnershipsQuery = `
      SELECT COUNT(*) as count FROM partnership_notifications
    `
    const existingPartnershipsResult = await client.query(existingPartnershipsQuery)
    
    await client.end()
    
    const debugInfo = {
      currentUser: {
        id: user.id,
        email: user.email
      },
      propertiesWithPartnership: partnershipPropsResult.rows,
      totalPartnershipProperties: partnershipPropsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      activeLeadsByUser: activeLeadsResult.rows,
      totalActiveLeads: activeLeadsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      currentUserLeads: userLeadsResult.rows,
      otherUsersProperties: otherPropsResult.rows,
      existingPartnerships: existingPartnershipsResult.rows[0].count,
      analysis: {
        canCreatePartnerships: otherPropsResult.rows.length > 0 && userLeadsResult.rows.length > 0,
        potentialMatches: []
      }
    }
    
    // Análise de matches potenciais
    for (const lead of userLeadsResult.rows) {
      for (const property of otherPropsResult.rows) {
        const isTypeMatch = lead.propertyType === property.propertyType
        const targetPrice = lead.interest === 'RENT' ? property.rentPrice : property.salePrice
        const isPriceMatch = targetPrice && (!lead.maxPrice || targetPrice <= lead.maxPrice)
        const isFinancingMatch = lead.interest !== 'BUY' || !lead.needsFinancing || property.acceptsFinancing
        
        if (isTypeMatch && isPriceMatch && isFinancingMatch) {
          debugInfo.analysis.potentialMatches.push({
            leadName: lead.name,
            propertyTitle: property.title,
            propertyOwner: property.ownerName,
            matchReasons: {
              typeMatch: isTypeMatch,
              priceMatch: isPriceMatch,
              financingMatch: isFinancingMatch
            }
          })
        }
      }
    }
    
    console.log('🔍 DEBUG PARTNERSHIP RESULTS:', JSON.stringify(debugInfo, null, 2))
    
    return NextResponse.json({
      success: true,
      debugInfo
    })
    
  } catch (error) {
    console.error('❌ Erro no debug de parcerias:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
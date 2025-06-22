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
    
    console.log('🧪 TESTANDO SISTEMA DE PARCERIAS')
    
    // 1. Verificar dados atuais do usuário
    const userStatsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM properties WHERE "userId" = $1) as properties,
        (SELECT COUNT(*) FROM leads WHERE "userId" = $1) as leads,
        (SELECT COUNT(*) FROM properties WHERE "userId" = $1 AND "acceptsPartnership" = true) as "propertiesWithPartnership",
        (SELECT COUNT(*) FROM partnership_notifications WHERE "toUserId" = $1 OR "fromUserId" = $1) as partnerships
    `
    const userStats = await client.query(userStatsQuery, [user.id])
    console.log('📊 Stats do usuário:', userStats.rows[0])
    
    // 2. Verificar se há outros usuários com propriedades
    const otherUsersQuery = `
      SELECT DISTINCT p."userId", u.name, COUNT(p.id) as properties
      FROM properties p
      JOIN users u ON p."userId" = u.id
      WHERE p."userId" != $1
        AND p."acceptsPartnership" = true
        AND p.status = 'AVAILABLE'
      GROUP BY p."userId", u.name
    `
    const otherUsers = await client.query(otherUsersQuery, [user.id])
    console.log('👥 Outros usuários com propriedades:', otherUsers.rows)
    
    // 3. Simular criação de lead que deveria gerar parceria
    if (otherUsers.rows.length > 0) {
      const testLead = {
        id: 'test_lead_' + Date.now(),
        name: 'Lead Teste Parceria',
        email: 'teste@parceria.com',
        phone: '11999999999',
        interest: 'RENT',
        propertyType: 'APARTMENT',
        minPrice: 500,
        maxPrice: 3000,
        preferredCities: JSON.stringify(['SÃO PAULO', 'SANTOS']),
        preferredStates: JSON.stringify(['SP']),
        userId: user.id
      }
      
      // Inserir lead teste
      const insertLeadQuery = `
        INSERT INTO leads (
          id, name, email, phone, interest, "propertyType", "minPrice", "maxPrice", 
          "preferredCities", "preferredStates", status, "userId", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', $11, NOW(), NOW())
        RETURNING *
      `
      
      try {
        const leadResult = await client.query(insertLeadQuery, [
          testLead.id, testLead.name, testLead.email, testLead.phone,
          testLead.interest, testLead.propertyType, testLead.minPrice, testLead.maxPrice,
          testLead.preferredCities, testLead.preferredStates, testLead.userId
        ])
        
        console.log('✅ Lead teste criado:', leadResult.rows[0].id)
        
        // Executar detecção de parceria reversa manualmente
        const { detectReversePartnerships } = require('@/lib/reverse-partnership-service')
        const partnershipResult = await detectReversePartnerships(testLead.id)
        console.log('🤝 Resultado da detecção:', partnershipResult)
        
        // Verificar se parcerias foram criadas
        const partnershipsQuery = `
          SELECT * FROM partnership_notifications 
          WHERE "fromUserId" = $1 OR "toUserId" = $1
          ORDER BY "createdAt" DESC
          LIMIT 5
        `
        const partnerships = await client.query(partnershipsQuery, [user.id])
        console.log('📋 Parcerias encontradas:', partnerships.rows)
        
        // Limpar lead teste
        await client.query('DELETE FROM leads WHERE id = $1', [testLead.id])
        
      } catch (leadError) {
        console.error('❌ Erro ao criar lead teste:', leadError)
      }
    }
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      userStats: userStats.rows[0],
      otherUsers: otherUsers.rows,
      message: 'Teste de parcerias executado - verifique os logs'
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de parcerias:', error)
    return NextResponse.json({
      error: 'Erro no teste',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
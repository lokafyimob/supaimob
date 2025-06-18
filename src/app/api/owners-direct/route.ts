import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar direto com pg (bypass Prisma)
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    const result = await client.query('SELECT * FROM owners ORDER BY "createdAt" DESC')
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      owners: result.rows
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao buscar proprietários',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, document, address, city, state, zipCode } = body
    
    // Conectar direto com pg (bypass Prisma)
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    // Gerar ID único
    const id = 'owner-' + Date.now()
    
    await client.query(`
      INSERT INTO owners (id, name, email, phone, document, address, city, state, "zipCode", "userId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [id, name, email, phone, document, address, city, state, zipCode, 'admin-123'])
    
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: 'Proprietário cadastrado com sucesso!',
      id
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao cadastrar proprietário',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
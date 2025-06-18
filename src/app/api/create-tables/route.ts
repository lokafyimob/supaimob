import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    // Criar tabela owners simples
    await client.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        document TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        "zipCode" TEXT NOT NULL,
        "userId" TEXT NOT NULL DEFAULT 'admin-123',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    
    await client.end()
    
    return NextResponse.json({ success: true, message: 'Tabela owners criada!' })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao criar tabela',
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
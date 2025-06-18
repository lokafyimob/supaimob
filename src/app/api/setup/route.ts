import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()
    
    // Inserir usuário admin
    await client.query(`
      INSERT INTO users (id, email, name, password, role, "isActive", "createdAt", "updatedAt") 
      VALUES ('admin-123', 'admin@crm.com', 'Admin', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.J8k8aZcB0.6WzU8F8YqJJv4ry/zO', 'ADMIN', true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `)
    
    // Criar tabela owners
    await client.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id TEXT PRIMARY KEY DEFAULT 'owner-' || EXTRACT(EPOCH FROM NOW()),
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
    
    return NextResponse.json({ 
      success: true, 
      message: 'Setup completo\! Login: admin@crm.com / admin123' 
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro no setup',
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
EOF < /dev/null

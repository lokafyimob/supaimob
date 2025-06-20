import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(_request: NextRequest) {
  try {
    console.log('Iniciando migração completa do banco de dados...')
    
    const migrations = []
    
    try {
      // Tornar companyId anulável na tabela owners
      await prisma.$executeRaw`ALTER TABLE owners ALTER COLUMN "companyId" DROP NOT NULL`
      migrations.push('✅ Campo owners.companyId agora aceita valores nulos')
    } catch {
      migrations.push('⚠️ Campo owners.companyId já aceita nulos ou falhou')
    }
    
    try {
      // Adicionar colunas faltantes na tabela properties
      await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'`
      migrations.push('✅ Coluna properties.images adicionada')
    } catch {
      migrations.push('⚠️ Coluna properties.images já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "amenities" TEXT DEFAULT '[]'`
      migrations.push('✅ Coluna properties.amenities adicionada')
    } catch {
      migrations.push('⚠️ Coluna properties.amenities já existe ou falhou')
    }
    
    try {
      // Adicionar colunas faltantes na tabela contracts
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "condominiumDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Coluna contracts.condominiumDeductible adicionada')
    } catch {
      migrations.push('⚠️ Coluna contracts.condominiumDeductible já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "maintenanceDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Coluna contracts.maintenanceDeductible adicionada')
    } catch {
      migrations.push('⚠️ Coluna contracts.maintenanceDeductible já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "iptuDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Coluna contracts.iptuDeductible adicionada')
    } catch {
      migrations.push('⚠️ Coluna contracts.iptuDeductible já existe ou falhou')
    }
    
    try {
      // Adicionar colunas faltantes na tabela payments
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoUrl" TEXT`
      migrations.push('✅ Coluna payments.boletoUrl adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.boletoUrl já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoCode" TEXT`
      migrations.push('✅ Coluna payments.boletoCode adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.boletoCode já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "penalty" REAL`
      migrations.push('✅ Coluna payments.penalty adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.penalty já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "interest" REAL`
      migrations.push('✅ Coluna payments.interest adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.interest já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "receipts" TEXT`
      migrations.push('✅ Coluna payments.receipts adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.receipts já existe ou falhou')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "notes" TEXT`
      migrations.push('✅ Coluna payments.notes adicionada')
    } catch {
      migrations.push('⚠️ Coluna payments.notes já existe ou falhou')
    }
    
    console.log('Resultados da migração:', migrations)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migração do banco de dados concluída', 
      results: migrations
    })
    
  } catch (error) {
    console.error('Erro na migração:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migração falhou', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}
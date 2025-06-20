import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migração de campos de financiamento...')

    // Verificar se as colunas já existem
    const checkProperties = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'acceptsFinancing'
    `

    const checkLeads = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' AND column_name = 'needsFinancing'
    `

    console.log('Properties column check:', checkProperties)
    console.log('Leads column check:', checkLeads)

    // Se as colunas não existem, criar elas
    if (Array.isArray(checkProperties) && checkProperties.length === 0) {
      console.log('➕ Adicionando coluna acceptsFinancing na tabela properties...')
      await prisma.$executeRaw`
        ALTER TABLE properties 
        ADD COLUMN "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false
      `
      console.log('✅ Coluna acceptsFinancing adicionada')
    } else {
      console.log('ℹ️ Coluna acceptsFinancing já existe')
    }

    if (Array.isArray(checkLeads) && checkLeads.length === 0) {
      console.log('➕ Adicionando coluna needsFinancing na tabela leads...')
      await prisma.$executeRaw`
        ALTER TABLE leads 
        ADD COLUMN "needsFinancing" BOOLEAN NOT NULL DEFAULT false
      `
      console.log('✅ Coluna needsFinancing adicionada')
    } else {
      console.log('ℹ️ Coluna needsFinancing já existe')
    }

    // Verificar as colunas criadas
    const finalCheck = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name IN ('properties', 'leads') 
        AND column_name IN ('acceptsFinancing', 'needsFinancing')
      ORDER BY table_name, column_name
    `

    console.log('📊 Verificação final das colunas:', finalCheck)

    return NextResponse.json({
      success: true,
      message: 'Migração de campos de financiamento concluída!',
      columns: finalCheck
    })

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
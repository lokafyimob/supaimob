import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { propertyId } = await request.json()
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID obrigatório' }, { status: 400 })
    }
    
    console.log('🔥 TESTANDO MATCHING PARA PROPRIEDADE:', propertyId)
    
    // Executar matching manualmente
    const { checkForPropertyMatches } = require('@/lib/property-matching-service')
    const result = await checkForPropertyMatches(propertyId)
    
    console.log('🎯 Resultado do property matching:', result)
    
    return NextResponse.json({
      success: true,
      propertyId,
      result,
      message: 'Property matching executado manualmente'
    })
    
  } catch (error) {
    console.error('❌ Erro no property matching forçado:', error)
    return NextResponse.json({
      error: 'Erro ao executar property matching',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
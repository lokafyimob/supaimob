import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { checkForMatchesRaw } from '@/lib/matching-service-raw'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { leadId } = await request.json()
    
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID obrigatório' }, { status: 400 })
    }
    
    console.log('🔥 FORÇANDO MATCHING PARA LEAD:', leadId)
    
    // Executar matching manualmente
    const result = await checkForMatchesRaw(leadId)
    
    console.log('🎯 Resultado do matching forçado:', result)
    
    return NextResponse.json({
      success: true,
      leadId,
      result,
      message: 'Matching executado manualmente'
    })
    
  } catch (error) {
    console.error('❌ Erro no matching forçado:', error)
    return NextResponse.json({
      error: 'Erro ao executar matching',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
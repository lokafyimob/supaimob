import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { AIListingFinder } from '@/lib/ai-listing-finder'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const resolvedParams = await params
    const leadId = resolvedParams.id

    console.log(`🔍 Buscando anúncios para lead: ${leadId}`)

    // Buscar o lead no banco
    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
        userId: user.id // Garantir que o lead pertence ao usuário
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o lead está ativo
    if (lead.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Lead não está ativo' },
        { status: 400 }
      )
    }

    // Instanciar o buscador de anúncios
    const listingFinder = new AIListingFinder()
    
    // Buscar anúncios usando IA
    const listings = await listingFinder.findListingsForLead(lead)

    console.log(`✅ Encontrados ${listings.length} anúncios para ${lead.name}`)

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        interest: lead.interest,
        propertyType: lead.propertyType,
        maxPrice: lead.maxPrice,
        preferredCities: JSON.parse(lead.preferredCities || '[]'),
        preferredStates: JSON.parse(lead.preferredStates || '[]')
      },
      listings,
      searchParams: {
        timestamp: new Date().toISOString(),
        totalFound: listings.length
      }
    })

  } catch (error) {
    console.error('Erro ao buscar anúncios:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
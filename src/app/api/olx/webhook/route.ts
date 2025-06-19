import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Webhook para receber leads e atualizações do OLX
 * POST /api/olx/webhook
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📨 OLX Webhook received')
    
    const body = await request.json()
    console.log('📋 Webhook data:', JSON.stringify(body, null, 2))

    // Verificar se é um lead ou atualização de anúncio
    if (body.type === 'lead' || body.event === 'lead') {
      return await handleLead(body)
    } else if (body.type === 'property_update' || body.event === 'property_update') {
      return await handlePropertyUpdate(body)
    } else if (body.type === 'listing_status' || body.event === 'listing_status') {
      return await handleListingStatus(body)
    } else {
      console.log('⚠️ Unknown webhook type:', body.type || body.event)
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook received but type not handled' 
      })
    }

  } catch (error) {
    console.error('❌ OLX Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Processar lead recebido do OLX
 */
async function handleLead(data: any) {
  try {
    console.log('👤 Processing lead from OLX')

    // Extrair dados do lead conforme formato do OLX
    const leadData = {
      name: data.contact?.name || data.name || 'Lead OLX',
      email: data.contact?.email || data.email || '',
      phone: data.contact?.phone || data.phone || '',
      interest: 'RENT' as const, // Assumir aluguel por padrão
      propertyType: mapPropertyType(data.property?.type) as any,
      maxPrice: parseFloat(data.property?.price) || 0,
      preferredCities: JSON.stringify([data.property?.city || '']),
      preferredStates: JSON.stringify([data.property?.state || '']),
      notes: `Lead recebido do OLX - Imóvel: ${data.property?.title || 'N/A'}`,
      status: 'ACTIVE' as const
    }

    // Verificar se lead já existe (por email ou telefone)
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { email: leadData.email },
          { phone: leadData.phone }
        ]
      }
    })

    let lead
    if (existingLead) {
      // Atualizar lead existente
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          ...leadData,
          lastContactDate: new Date(),
          notes: `${existingLead.notes}\n\n${leadData.notes}`
        }
      })
      console.log('🔄 Lead atualizado:', lead.id)
    } else {
      // Buscar primeiro usuário ativo para associar o lead
      const firstUser = await prisma.user.findFirst({
        where: { isActive: true },
        include: { company: true }
      })
      
      if (!firstUser || !firstUser.companyId) {
        return NextResponse.json({
          error: 'Nenhum usuário ativo encontrado para criar lead'
        }, { status: 500 })
      }

      // Criar novo lead
      lead = await prisma.lead.create({
        data: {
          ...leadData,
          lastContactDate: new Date(),
          companyId: firstUser.companyId,
          userId: firstUser.id
        }
      })
      console.log('✅ Novo lead criado:', lead.id)
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: existingLead ? 'Lead atualizado' : 'Lead criado'
    })

  } catch (error) {
    console.error('❌ Error processing lead:', error)
    return NextResponse.json(
      { error: 'Error processing lead' },
      { status: 500 }
    )
  }
}

/**
 * Processar atualização de propriedade
 */
async function handlePropertyUpdate(_data: Record<string, unknown>) {
  try {
    console.log('🏠 Processing property update from OLX')

    // TODO: Implementar sincronização de propriedades
    // Buscar propriedade por ID externo do OLX
    // Atualizar dados no CRM

    return NextResponse.json({
      success: true,
      message: 'Property update processed'
    })

  } catch (error) {
    console.error('❌ Error processing property update:', error)
    return NextResponse.json(
      { error: 'Error processing property update' },
      { status: 500 }
    )
  }
}

/**
 * Processar mudança de status do anúncio
 */
async function handleListingStatus(_data: Record<string, unknown>) {
  try {
    console.log('📊 Processing listing status from OLX')

    // TODO: Implementar atualização de status
    // Marcar imóvel como ativo/inativo baseado no status do OLX

    return NextResponse.json({
      success: true,
      message: 'Listing status processed'
    })

  } catch (error) {
    console.error('❌ Error processing listing status:', error)
    return NextResponse.json(
      { error: 'Error processing listing status' },
      { status: 500 }
    )
  }
}

/**
 * Mapear tipo de propriedade do OLX para o sistema
 */
function mapPropertyType(olxType: string): string {
  const typeMap: { [key: string]: string } = {
    'apartamento': 'APARTMENT',
    'casa': 'HOUSE',
    'terreno': 'LAND',
    'comercial': 'COMMERCIAL',
    'studio': 'STUDIO'
  }

  return typeMap[olxType?.toLowerCase()] || 'APARTMENT'
}

/**
 * GET endpoint para teste
 */
export async function GET() {
  return NextResponse.json({
    status: 'OLX Webhook endpoint active',
    url: 'https://lokafyimob.vercel.app/api/olx/webhook',
    timestamp: new Date().toISOString()
  })
}
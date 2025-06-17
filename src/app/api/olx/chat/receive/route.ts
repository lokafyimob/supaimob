import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Webhook para receber mensagens do chat OLX
 * POST /api/olx/chat/receive
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💬 OLX Chat message received')
    
    // Verificar autenticação Bearer token (opcional)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // TODO: Verificar token se necessário
    // if (token !== process.env.OLX_WEBHOOK_TOKEN) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const messageData = await request.json()
    console.log('📨 Message data:', JSON.stringify(messageData, null, 2))

    // Estrutura esperada do OLX:
    const {
      chatId,
      message,
      senderType,
      email,
      name,
      phone,
      messageTimestamp,
      messageId,
      origin,
      listId
    } = messageData

    // Verificar se é mensagem de comprador (não sistema)
    if (senderType === 'system' || origin === 'seller') {
      console.log('⏭️ Skipping system/seller message')
      return NextResponse.json({ 
        success: true, 
        message: 'System/seller message ignored' 
      })
    }

    // Processar mensagem do comprador
    await processIncomingMessage({
      chatId,
      message,
      email,
      name,
      phone,
      messageTimestamp,
      messageId,
      listId
    })

    return NextResponse.json({
      success: true,
      message: 'Message processed successfully',
      messageId
    })

  } catch (error) {
    console.error('❌ OLX Chat webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Processar mensagem recebida do chat OLX
 */
async function processIncomingMessage(data: {
  chatId: string
  message: string
  email?: string
  name?: string
  phone?: string
  messageTimestamp: string
  messageId: string
  listId?: string
}) {
  try {
    console.log('🔄 Processing incoming chat message')

    // 1. Buscar ou criar lead baseado no email/telefone
    let lead = null
    if (data.email || data.phone) {
      lead = await prisma.lead.findFirst({
        where: {
          OR: [
            { email: data.email },
            { phone: data.phone }
          ]
        }
      })

      if (!lead && (data.email || data.phone || data.name)) {
        // Criar novo lead
        lead = await prisma.lead.create({
          data: {
            name: data.name || 'Cliente OLX',
            email: data.email || '',
            phone: data.phone || '',
            interest: 'RENT', // Assumir aluguel por padrão
            propertyType: 'APARTMENT',
            maxPrice: 0,
            preferredCities: JSON.stringify([]),
            preferredStates: JSON.stringify([]),
            amenities: JSON.stringify([]),
            notes: `Lead criado via chat OLX - Chat ID: ${data.chatId}`,
            status: 'ACTIVE',
            lastContactDate: new Date()
          }
        })
        console.log('✅ New lead created from chat:', lead.id)
      } else if (lead) {
        // Atualizar última data de contato
        await prisma.lead.update({
          where: { id: lead.id },
          data: { lastContactDate: new Date() }
        })
        console.log('🔄 Lead updated from chat:', lead.id)
      }
    }

    // 2. Salvar mensagem no sistema
    await saveChatMessage({
      chatId: data.chatId,
      messageId: data.messageId,
      message: data.message,
      senderName: data.name || 'Cliente OLX',
      senderEmail: data.email,
      senderPhone: data.phone,
      timestamp: new Date(data.messageTimestamp),
      listId: data.listId,
      leadId: lead?.id
    })

    // 3. Notificar equipe sobre nova mensagem
    await notifyTeamAboutMessage({
      leadId: lead?.id,
      leadName: lead?.name || data.name || 'Cliente OLX',
      message: data.message,
      chatId: data.chatId
    })

    console.log('✅ Message processed successfully')

  } catch (error) {
    console.error('❌ Error processing message:', error)
    throw error
  }
}

/**
 * Salvar mensagem no banco de dados
 */
async function saveChatMessage(data: {
  chatId: string
  messageId: string
  message: string
  senderName: string
  senderEmail?: string
  senderPhone?: string
  timestamp: Date
  listId?: string
  leadId?: string
}) {
  try {
    // Por enquanto, vamos criar uma tabela simples para mensagens
    // TODO: Criar model ChatMessage no Prisma schema
    
    console.log('💾 Saving chat message:', {
      chatId: data.chatId,
      messageId: data.messageId,
      message: data.message.substring(0, 50) + '...'
    })

    // Por enquanto, adicionar às notas do lead se existir
    if (data.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: data.leadId }
      })

      if (lead) {
        const newNote = `\n\n[${data.timestamp.toLocaleString('pt-BR')}] Chat OLX: ${data.message}`
        await prisma.lead.update({
          where: { id: data.leadId },
          data: {
            notes: (lead.notes || '') + newNote
          }
        })
      }
    }

  } catch (error) {
    console.error('❌ Error saving message:', error)
  }
}

/**
 * Notificar equipe sobre nova mensagem
 */
async function notifyTeamAboutMessage(data: {
  leadId?: string
  leadName: string
  message: string
  chatId: string
}) {
  try {
    console.log('🔔 Notifying team about new chat message')
    
    // TODO: Implementar notificações
    // - Email para equipe
    // - Notificação no dashboard
    // - WhatsApp/Slack integration
    
    console.log(`📢 Nova mensagem no chat OLX de ${data.leadName}: ${data.message.substring(0, 100)}...`)

  } catch (error) {
    console.error('❌ Error sending notification:', error)
  }
}

/**
 * Configurar webhook no OLX
 * POST /api/olx/chat/receive/setup
 */
export async function PUT(request: NextRequest) {
  try {
    const webhookUrl = 'https://lokafyimob.vercel.app/api/olx/chat/receive'
    
    // TODO: Implementar configuração automática do webhook no OLX
    // POST para https://apps.olx.com.br/autoservice/v1/chat
    // com { "webhookUrl": webhookUrl }
    
    return NextResponse.json({
      success: true,
      webhookUrl,
      message: 'Configure this URL in OLX Chat settings'
    })

  } catch (error) {
    console.error('❌ Error setting up webhook:', error)
    return NextResponse.json(
      { error: 'Error setting up webhook' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para teste
 */
export async function GET() {
  return NextResponse.json({
    status: 'OLX Chat webhook endpoint active',
    url: 'https://lokafyimob.vercel.app/api/olx/chat/receive',
    timestamp: new Date().toISOString(),
    note: 'Configure this URL in OLX Chat webhook settings'
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { olxChatService } from '@/lib/olx-chat-service'

/**
 * API Route para enviar mensagens via chat OLX
 * POST /api/olx-chat
 */
export async function POST(request: NextRequest) {
  try {
    const { chatId, message, token } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'chatId e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Se token foi fornecido na requisição, usar ele
    if (token) {
      olxChatService.setToken(token)
    }

    const result = await olxChatService.sendMessage(chatId, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro na API OLX Chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * API Route para testar conexão com OLX
 * GET /api/olx-chat
 */
export async function GET() {
  try {
    const result = await olxChatService.testConnection()
    
    return NextResponse.json({
      configured: olxChatService.isConfigured(),
      connectionTest: result
    })
    
  } catch (error) {
    console.error('Erro ao testar conexão OLX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
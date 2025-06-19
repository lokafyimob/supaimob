/**
 * Serviço para integração com o Chat do OLX
 * Baseado na documentação: https://developers.olx.com.br/chat/send_message.html
 */

interface OLXChatMessage {
  textMessage: string
  messageId: string
  chatId: string
}

interface OLXChatResponse {
  success: boolean
  message?: string
  error?: string
}

export class OLXChatService {
  private baseUrl = 'https://apps.olx.com.br/autoservice/v1'
  private token: string | null = null

  constructor(token?: string) {
    this.token = token || process.env.OLX_API_TOKEN || null
  }

  /**
   * Define o token de autenticação do OLX
   */
  setToken(token: string) {
    this.token = token
  }

  /**
   * Gera um ID único para a mensagem
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Envia uma mensagem via chat do OLX
   */
  async sendMessage(chatId: string, message: string): Promise<OLXChatResponse> {
    if (!this.token) {
      return {
        success: false,
        error: 'Token de autenticação OLX não configurado'
      }
    }

    if (!chatId || !message.trim()) {
      return {
        success: false,
        error: 'ChatId e mensagem são obrigatórios'
      }
    }

    try {
      const payload: OLXChatMessage = {
        textMessage: message.trim(),
        messageId: this.generateMessageId(),
        chatId: chatId
      }

      const response = await fetch(`${this.baseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Mensagem enviada com sucesso'
        }
      }

      // Tratar diferentes códigos de erro
      switch (response.status) {
        case 401:
          return {
            success: false,
            error: 'Token de autenticação inválido'
          }
        case 400:
          return {
            success: false,
            error: 'Dados inválidos ou problema de integração'
          }
        case 500:
          return {
            success: false,
            error: 'Erro interno do servidor OLX'
          }
        default:
          return {
            success: false,
            error: `Erro HTTP ${response.status}: ${response.statusText}`
          }
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem OLX:', error)
      return {
        success: false,
        error: 'Erro de conexão com a API do OLX'
      }
    }
  }

  /**
   * Valida se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!this.token
  }

  /**
   * Testa a conexão com a API do OLX
   */
  async testConnection(): Promise<OLXChatResponse> {
    if (!this.token) {
      return {
        success: false,
        error: 'Token não configurado'
      }
    }

    // Fazer uma requisição de teste (pode ser necessário ajustar baseado na API real)
    try {
      const response = await fetch(`${this.baseUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          textMessage: 'teste',
          messageId: 'test_connection',
          chatId: 'test'
        })
      })

      return {
        success: response.status !== 401,
        message: response.status === 401 ? 'Token inválido' : 'Conexão OK'
      }
    } catch {
      return {
        success: false,
        error: 'Erro de conexão'
      }
    }
  }
}

// Instância singleton para uso global
export const olxChatService = new OLXChatService()
interface NotificationData {
  recipient: string
  subject: string
  message: string
  type: 'EMAIL' | 'WHATSAPP' | 'SMS'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  companyId?: string
  templateData?: Record<string, unknown>
}

interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName: string
}

interface WhatsAppConfig {
  apiKey: string
  phoneNumber: string
}

export class NotificationService {
  private emailConfig: EmailConfig
  private whatsappConfig: WhatsAppConfig

  constructor() {
    this.emailConfig = {
      apiKey: process.env.EMAIL_SERVICE_API_KEY || '',
      fromEmail: 'noreply@crm-imobiliario.com',
      fromName: 'CRM Imobiliário'
    }

    this.whatsappConfig = {
      apiKey: process.env.WHATSAPP_API_KEY || '',
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || ''
    }
  }

  async sendEmail(data: NotificationData): Promise<boolean> {
    try {
      const emailData = {
        to: data.recipient,
        from: {
          email: this.emailConfig.fromEmail,
          name: this.emailConfig.fromName
        },
        subject: data.subject,
        html: this.generateEmailTemplate(data.message, data.templateData),
        text: data.message
      }

      // Simular envio de email (implementar com SendGrid, Resend, etc.)
      console.log('Sending email:', emailData)
      
      // Aqui você integraria com um serviço real como SendGrid:
      // const response = await fetch('https://api.sendgrid.v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.emailConfig.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(emailData)
      // })

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  async sendWhatsApp(data: NotificationData): Promise<boolean> {
    try {
      const whatsappData = {
        phone: data.recipient,
        message: data.message,
        type: 'text'
      }

      // Simular envio de WhatsApp (implementar com Twilio, etc.)
      console.log('Sending WhatsApp:', whatsappData)
      
      // Aqui você integraria com um serviço real como Twilio:
      // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      //     'Content-Type': 'application/x-www-form-urlencoded'
      //   },
      //   body: new URLSearchParams({
      //     From: `whatsapp:${this.whatsappConfig.phoneNumber}`,
      //     To: `whatsapp:${data.recipient}`,
      //     Body: data.message
      //   })
      // })

      return true
    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      return false
    }
  }

  async sendNotification(data: NotificationData): Promise<boolean> {
    switch (data.type) {
      case 'EMAIL':
        return await this.sendEmail(data)
      case 'WHATSAPP':
        return await this.sendWhatsApp(data)
      default:
        console.error('Unsupported notification type:', data.type)
        return false
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]): Promise<{
    sent: number
    failed: number
    results: boolean[]
  }> {
    const results = await Promise.all(
      notifications.map(notification => this.sendNotification(notification))
    )

    const sent = results.filter(result => result).length
    const failed = results.filter(result => !result).length

    return { sent, failed, results }
  }

  generatePaymentReminderEmail(tenantName: string, propertyTitle: string, amount: number, dueDate: string): NotificationData {
    return {
      recipient: '',
      subject: `Lembrete de Pagamento - ${propertyTitle}`,
      message: `
        Olá ${tenantName},

        Este é um lembrete de que o pagamento do aluguel do imóvel "${propertyTitle}" 
        no valor de R$ ${amount.toLocaleString('pt-BR')} vence em ${dueDate}.

        Por favor, efetue o pagamento até a data de vencimento para evitar multas e juros.

        Em caso de dúvidas, entre em contato conosco.

        Atenciosamente,
        Equipe CRM Imobiliário
      `,
      type: 'EMAIL',
      priority: 'MEDIUM',
      templateData: {
        tenantName,
        propertyTitle,
        amount,
        dueDate
      }
    }
  }

  generateOverduePaymentAlert(tenantName: string, propertyTitle: string, amount: number, daysPastDue: number): NotificationData {
    return {
      recipient: '',
      subject: `URGENTE: Pagamento em Atraso - ${propertyTitle}`,
      message: `
        Prezado(a) ${tenantName},

        Identificamos que o pagamento do aluguel do imóvel "${propertyTitle}" 
        no valor de R$ ${amount.toLocaleString('pt-BR')} está em atraso há ${daysPastDue} dias.

        Multa e juros podem estar sendo aplicados conforme contrato.

        Entre em contato urgentemente para regularizar a situação.

        Atenciosamente,
        Equipe CRM Imobiliário
      `,
      type: 'EMAIL',
      priority: 'HIGH',
      templateData: {
        tenantName,
        propertyTitle,
        amount,
        daysPastDue
      }
    }
  }

  generateContractExpiringAlert(ownerName: string, tenantName: string, propertyTitle: string, expirationDate: string): NotificationData {
    return {
      recipient: '',
      subject: `Contrato Vencendo - ${propertyTitle}`,
      message: `
        Olá ${ownerName},

        O contrato de locação do imóvel "${propertyTitle}" com o(a) inquilino(a) 
        ${tenantName} vencerá em ${expirationDate}.

        É necessário tomar as providências para renovação ou finalização do contrato.

        Entre em contato para agendar os procedimentos necessários.

        Atenciosamente,
        Equipe CRM Imobiliário
      `,
      type: 'EMAIL',
      priority: 'MEDIUM',
      templateData: {
        ownerName,
        tenantName,
        propertyTitle,
        expirationDate
      }
    }
  }

  generateDelinquencyRiskAlert(tenantName: string, propertyTitle: string, riskLevel: string, probability: number): NotificationData {
    return {
      recipient: '',
      subject: `Alerta de Risco de Inadimplência - ${propertyTitle}`,
      message: `
        ALERTA AUTOMÁTICO DO SISTEMA

        O inquilino ${tenantName} do imóvel "${propertyTitle}" foi identificado 
        com risco ${riskLevel} de inadimplência.

        Probabilidade de atraso: ${probability}%

        Recomendamos acompanhamento próximo e possíveis ações preventivas.

        Acesse o sistema para mais detalhes e recomendações específicas.

        Sistema CRM Imobiliário
      `,
      type: 'EMAIL',
      priority: riskLevel === 'CRITICAL' ? 'URGENT' : 'HIGH',
      templateData: {
        tenantName,
        propertyTitle,
        riskLevel,
        probability
      }
    }
  }

  private generateEmailTemplate(message: string, _templateData?: Record<string, unknown>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRM Imobiliário</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CRM Imobiliário</h1>
          </div>
          <div class="content">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>Este é um email automático. Não responda a esta mensagem.</p>
            <p>CRM Imobiliário - Sistema de Gestão Inteligente</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
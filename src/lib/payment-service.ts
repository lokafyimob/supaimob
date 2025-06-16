interface BoletoData {
  contractId: string
  amount: number
  dueDate: string
  tenantName: string
  tenantDocument: string
  description: string
  instructions?: string[]
}

interface BoletoResponse {
  boletoCode: string
  boletoUrl: string
  barCode: string
  pixQrCode?: string
  expirationDate: string
}

interface PaymentUpdate {
  paymentId: string
  status: 'PAID' | 'OVERDUE' | 'CANCELLED'
  paidDate?: string
  paidAmount?: number
  penalty?: number
  interest?: number
}

export class PaymentService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.BOLETO_API_KEY || ''
    this.baseUrl = process.env.BOLETO_API_URL || 'https://api.exemplo.com/v1'
  }

  async generateBoleto(data: BoletoData): Promise<BoletoResponse> {
    try {
      const boletoPayload = {
        beneficiary: {
          name: 'CRM Imobiliário Ltda',
          document: '12.345.678/0001-90',
          bank_account: {
            bank_code: '341',
            agency: '1234',
            account: '12345-6'
          }
        },
        payer: {
          name: data.tenantName,
          document: data.tenantDocument,
          address: {
            line_1: 'Endereço conforme contrato',
            city: 'Cidade',
            state: 'SP',
            zip_code: '00000-000'
          }
        },
        amount: Math.round(data.amount * 100), // Converter para centavos
        due_date: data.dueDate,
        description: data.description,
        instructions: data.instructions || [
          'Pagar até o vencimento',
          'Após vencimento multa de 2% + juros 1% ao mês'
        ],
        fine: {
          type: 'percentage',
          value: 2 // 2% de multa
        },
        interest: {
          type: 'percentage',
          value: 1 // 1% ao mês
        }
      }

      // Simular chamada para API de boletos (ex: Asaas, PagSeguro, etc.)
      console.log('Generating boleto:', boletoPayload)

      // Aqui você faria a chamada real:
      // const response = await fetch(`${this.baseUrl}/boletos`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(boletoPayload)
      // })

      // Simular resposta de sucesso
      const mockResponse: BoletoResponse = {
        boletoCode: this.generateBoletoCode(),
        boletoUrl: `https://boleto.exemplo.com/pdf/${Date.now()}`,
        barCode: this.generateBarCode(),
        pixQrCode: this.generatePixQrCode(data.amount),
        expirationDate: data.dueDate
      }

      return mockResponse
    } catch (error) {
      console.error('Error generating boleto:', error)
      throw new Error('Erro ao gerar boleto')
    }
  }

  async checkPaymentStatus(boletoCode: string): Promise<{
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    paidDate?: string
    paidAmount?: number
  }> {
    try {
      // Simular consulta de status
      console.log('Checking payment status for:', boletoCode)

      // Aqui você faria a consulta real:
      // const response = await fetch(`${this.baseUrl}/boletos/${boletoCode}`, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`
      //   }
      // })

      // Simular resposta
      return {
        status: 'PENDING',
        paidDate: undefined,
        paidAmount: undefined
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      throw new Error('Erro ao consultar status do pagamento')
    }
  }

  async updatePaymentStatus(update: PaymentUpdate): Promise<boolean> {
    try {
      // Aqui você atualizaria o status no banco de dados
      console.log('Updating payment status:', update)
      
      // Implementar lógica de atualização no Prisma
      // const payment = await prisma.payment.update({
      //   where: { id: update.paymentId },
      //   data: {
      //     status: update.status,
      //     paidDate: update.paidDate ? new Date(update.paidDate) : null,
      //     penalty: update.penalty,
      //     interest: update.interest
      //   }
      // })

      return true
    } catch (error) {
      console.error('Error updating payment status:', error)
      return false
    }
  }

  async generateMonthlyPayments(contractId: string, startDate: string, endDate: string, amount: number): Promise<string[]> {
    try {
      const payments: string[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      let currentDate = new Date(start)
      
      while (currentDate <= end) {
        const dueDate = new Date(currentDate)
        dueDate.setDate(10) // Vencimento dia 10 de cada mês
        
        // Gerar pagamento no banco de dados
        // const payment = await prisma.payment.create({
        //   data: {
        //     contractId,
        //     amount,
        //     dueDate,
        //     status: 'PENDING'
        //   }
        // })
        
        payments.push(`payment_${Date.now()}_${currentDate.getMonth()}`)
        
        // Próximo mês
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      return payments
    } catch (error) {
      console.error('Error generating monthly payments:', error)
      throw new Error('Erro ao gerar pagamentos mensais')
    }
  }

  async calculateLateFees(originalAmount: number, dueDate: string, companyId: string, currentDate: string = new Date().toISOString()): Promise<{
    penalty: number
    interest: number
    totalAmount: number
    daysPastDue: number
    effectiveDaysForCharges: number
  }> {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    try {
      // Buscar configurações financeiras da empresa
      const financialSettings = await prisma.settings.findUnique({
        where: {
          companyId_key: {
            companyId: companyId,
            key: 'financial'
          }
        }
      })
      
      // Configurações padrão caso não existam no banco
      let settings = {
        penaltyRate: 2.0,          // 2% de multa
        dailyInterestRate: 0.033,  // 0.033% ao dia (1% ao mês)
        gracePeriodDays: 0,        // sem carência
        maxInterestDays: 365       // máximo 1 ano de juros
      }
      
      // Aplicar configurações salvas se existirem
      if (financialSettings) {
        try {
          const savedSettings = JSON.parse(financialSettings.value)
          settings = { ...settings, ...savedSettings }
        } catch (error) {
          console.warn('Erro ao parsear configurações financeiras, usando padrões:', error)
        }
      }
      
      const due = new Date(dueDate)
      const current = new Date(currentDate)
      const daysPastDue = Math.max(0, Math.floor((current.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
      
      // Se não passou do vencimento, não há multa nem juros
      if (daysPastDue <= 0) {
        return {
          penalty: 0,
          interest: 0,
          totalAmount: originalAmount,
          daysPastDue: 0,
          effectiveDaysForCharges: 0
        }
      }
      
      // Aplicar período de carência - só começa a cobrar após o período de carência
      const effectiveDaysForCharges = Math.max(0, daysPastDue - settings.gracePeriodDays)
      
      // Se ainda está no período de carência, não cobra multa nem juros
      if (effectiveDaysForCharges <= 0) {
        return {
          penalty: 0,
          interest: 0,
          totalAmount: originalAmount,
          daysPastDue,
          effectiveDaysForCharges: 0
        }
      }
      
      // Calcular multa (aplicada uma única vez após o período de carência)
      const penalty = originalAmount * (settings.penaltyRate / 100)
      
      // Calcular juros (limitado pelo máximo de dias configurado)
      const daysForInterest = Math.min(effectiveDaysForCharges, settings.maxInterestDays)
      const interest = originalAmount * (settings.dailyInterestRate / 100) * daysForInterest
      
      const totalAmount = originalAmount + penalty + interest
      
      return {
        penalty: Math.round(penalty * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        daysPastDue,
        effectiveDaysForCharges
      }
    } finally {
      await prisma.$disconnect()
    }
  }

  async processWebhook(webhookData: any): Promise<boolean> {
    try {
      // Processar webhook de pagamento
      console.log('Processing payment webhook:', webhookData)
      
      const { event, boleto } = webhookData
      
      switch (event) {
        case 'payment.paid':
          await this.updatePaymentStatus({
            paymentId: boleto.external_id,
            status: 'PAID',
            paidDate: boleto.paid_date,
            paidAmount: boleto.paid_amount / 100 // Converter de centavos
          })
          break
          
        case 'payment.overdue':
          await this.updatePaymentStatus({
            paymentId: boleto.external_id,
            status: 'OVERDUE'
          })
          break
          
        case 'payment.cancelled':
          await this.updatePaymentStatus({
            paymentId: boleto.external_id,
            status: 'CANCELLED'
          })
          break
      }
      
      return true
    } catch (error) {
      console.error('Error processing webhook:', error)
      return false
    }
  }

  private generateBoletoCode(): string {
    // Gerar código de boleto simulado
    const digits = '1234567890'
    let code = ''
    for (let i = 0; i < 47; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    return code
  }

  private generateBarCode(): string {
    // Gerar código de barras simulado
    const digits = '1234567890'
    let code = ''
    for (let i = 0; i < 44; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    return code
  }

  private generatePixQrCode(amount: number): string {
    // Gerar QR Code PIX simulado
    return `00020126580014BR.GOV.BCB.PIX01365f84c2c3-4a77-4b6a-9f8e-123456789abc5204000053039865802BR5909TESTE6009SAO PAULO6220051634567890123456304`
  }

  async generatePaymentReport(startDate: string, endDate: string): Promise<{
    totalReceived: number
    totalPending: number
    totalOverdue: number
    paymentsByMonth: Array<{ month: string; amount: number; count: number }>
    delinquencyRate: number
  }> {
    try {
      // Simular relatório de pagamentos
      // Aqui você consultaria o banco de dados real
      
      return {
        totalReceived: 125000.00,
        totalPending: 45000.00,
        totalOverdue: 12000.00,
        paymentsByMonth: [
          { month: '2024-01', amount: 42000.00, count: 28 },
          { month: '2024-02', amount: 38500.00, count: 26 },
          { month: '2024-03', amount: 44500.00, count: 30 }
        ],
        delinquencyRate: 8.5
      }
    } catch (error) {
      console.error('Error generating payment report:', error)
      throw new Error('Erro ao gerar relatório de pagamentos')
    }
  }
}
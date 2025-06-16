import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { LLMChain } from 'langchain/chains'

interface PaymentHistory {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  penalty?: number
  interest?: number
}

interface TenantData {
  id: string
  name: string
  email: string
  phone: string
  income: number
  paymentHistory: PaymentHistory[]
  contractStartDate: string
  rentAmount: number
}

interface DelinquencyPrediction {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  probability: number
  reasons: string[]
  recommendations: string[]
  suggestedActions: string[]
}

const DELINQUENCY_ANALYSIS_TEMPLATE = `
Você é um especialista em análise de risco de crédito imobiliário.
Analise os dados do inquilino e histórico de pagamentos para prever o risco de inadimplência.

Dados do Inquilino:
- Nome: {tenantName}
- Renda: R$ {income}
- Valor do Aluguel: R$ {rentAmount}
- Comprometimento da Renda: {incomeRatio}%
- Data de Início do Contrato: {contractStartDate}

Histórico de Pagamentos (últimos 12 meses):
{paymentHistory}

Estatísticas de Pagamento:
- Total de Pagamentos: {totalPayments}
- Pagamentos em Dia: {onTimePayments}
- Pagamentos em Atraso: {latePayments}
- Taxa de Pontualidade: {punctualityRate}%
- Dias Médios de Atraso: {averageDelayDays}

Com base nessas informações, faça uma análise detalhada e classifique o risco de inadimplência.

Considere fatores como:
1. Comprometimento da renda (ideal < 30%)
2. Histórico de pontualidade
3. Padrão de atrasos (frequência e duração)
4. Tendência recente de pagamentos
5. Tempo de relacionamento

Responda em formato JSON com:
{{
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "probability": número_de_0_a_100,
  "reasons": ["razão1", "razão2", ...],
  "recommendations": ["recomendação1", "recomendação2", ...],
  "suggestedActions": ["ação1", "ação2", ...]
}}
`

export class AIDelinquencyDetector {
  private llm: ChatOpenAI
  private chain: LLMChain

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = PromptTemplate.fromTemplate(DELINQUENCY_ANALYSIS_TEMPLATE)
    this.chain = new LLMChain({
      llm: this.llm,
      prompt: prompt,
    })
  }

  async analyzeDelinquencyRisk(tenantData: TenantData): Promise<DelinquencyPrediction> {
    try {
      const stats = this.calculatePaymentStats(tenantData.paymentHistory)
      const incomeRatio = (tenantData.rentAmount / tenantData.income) * 100

      const result = await this.chain.call({
        tenantName: tenantData.name,
        income: tenantData.income.toLocaleString('pt-BR'),
        rentAmount: tenantData.rentAmount.toLocaleString('pt-BR'),
        incomeRatio: incomeRatio.toFixed(1),
        contractStartDate: new Date(tenantData.contractStartDate).toLocaleDateString('pt-BR'),
        paymentHistory: this.formatPaymentHistory(tenantData.paymentHistory),
        totalPayments: stats.totalPayments,
        onTimePayments: stats.onTimePayments,
        latePayments: stats.latePayments,
        punctualityRate: stats.punctualityRate.toFixed(1),
        averageDelayDays: stats.averageDelayDays.toFixed(1)
      })

      return JSON.parse(result.text)
    } catch (error) {
      console.error('Error analyzing delinquency risk:', error)
      return {
        riskLevel: 'MEDIUM',
        probability: 50,
        reasons: ['Erro na análise'],
        recommendations: ['Análise manual necessária'],
        suggestedActions: ['Revisar dados manualmente']
      }
    }
  }

  async batchAnalyzeRisks(tenants: TenantData[]): Promise<Map<string, DelinquencyPrediction>> {
    const results = new Map<string, DelinquencyPrediction>()
    
    for (const tenant of tenants) {
      try {
        const prediction = await this.analyzeDelinquencyRisk(tenant)
        results.set(tenant.id, prediction)
      } catch (error) {
        console.error(`Error analyzing risk for tenant ${tenant.id}:`, error)
      }
    }

    return results
  }

  private calculatePaymentStats(payments: PaymentHistory[]) {
    const totalPayments = payments.length
    let onTimePayments = 0
    let latePayments = 0
    let totalDelayDays = 0

    payments.forEach(payment => {
      if (payment.status === 'PAID' && payment.paidDate) {
        const dueDate = new Date(payment.dueDate)
        const paidDate = new Date(payment.paidDate)
        const delayDays = Math.max(0, (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (delayDays <= 0) {
          onTimePayments++
        } else {
          latePayments++
          totalDelayDays += delayDays
        }
      } else if (payment.status === 'OVERDUE') {
        latePayments++
        const dueDate = new Date(payment.dueDate)
        const today = new Date()
        const delayDays = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        totalDelayDays += Math.max(0, delayDays)
      }
    })

    const punctualityRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0
    const averageDelayDays = latePayments > 0 ? totalDelayDays / latePayments : 0

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      punctualityRate,
      averageDelayDays
    }
  }

  private formatPaymentHistory(payments: PaymentHistory[]): string {
    return payments
      .slice(-12) // últimos 12 pagamentos
      .map(payment => {
        const status = this.translateStatus(payment.status)
        const dueDate = new Date(payment.dueDate).toLocaleDateString('pt-BR')
        const paidDate = payment.paidDate 
          ? new Date(payment.paidDate).toLocaleDateString('pt-BR')
          : 'Não pago'
        
        return `- Vencimento: ${dueDate}, Pagamento: ${paidDate}, Status: ${status}, Valor: R$ ${payment.amount.toLocaleString('pt-BR')}`
      })
      .join('\n')
  }

  private translateStatus(status: string): string {
    const translations = {
      'PENDING': 'Pendente',
      'PAID': 'Pago',
      'OVERDUE': 'Em Atraso',
      'CANCELLED': 'Cancelado'
    }
    return translations[status as keyof typeof translations] || status
  }

  async generateRiskReport(predictions: Map<string, DelinquencyPrediction>): Promise<{
    summary: {
      totalTenants: number
      lowRisk: number
      mediumRisk: number
      highRisk: number
      criticalRisk: number
    }
    urgentActions: string[]
    trends: string[]
  }> {
    const summary = {
      totalTenants: predictions.size,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0
    }

    const urgentActions: string[] = []

    predictions.forEach((prediction, tenantId) => {
      switch (prediction.riskLevel) {
        case 'LOW':
          summary.lowRisk++
          break
        case 'MEDIUM':
          summary.mediumRisk++
          break
        case 'HIGH':
          summary.highRisk++
          urgentActions.push(`Inquilino ${tenantId}: ${prediction.suggestedActions[0]}`)
          break
        case 'CRITICAL':
          summary.criticalRisk++
          urgentActions.push(`URGENTE - Inquilino ${tenantId}: ${prediction.suggestedActions[0]}`)
          break
      }
    })

    const trends = [
      `${summary.highRisk + summary.criticalRisk} inquilinos em risco alto/crítico`,
      `Taxa de risco geral: ${((summary.highRisk + summary.criticalRisk) / summary.totalTenants * 100).toFixed(1)}%`
    ]

    return {
      summary,
      urgentActions: urgentActions.slice(0, 10), // Top 10 ações urgentes
      trends
    }
  }
}
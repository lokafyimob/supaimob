import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'

interface ContractData {
  propertyTitle: string
  propertyAddress: string
  propertyType: string
  rentAmount: number
  depositAmount: number
  startDate: string
  endDate: string
  ownerName: string
  ownerDocument: string
  ownerEmail: string
  tenantName: string
  tenantDocument: string
  tenantEmail: string
  tenantIncome: number
  amenities?: string[]
  specialTerms?: string
}

const CONTRACT_TEMPLATE = `
Você é um assistente especializado em gerar contratos de locação imobiliária no Brasil.
Gere um contrato de locação completo e juridicamente válido com base nas informações fornecidas.

Informações do Imóvel:
- Título: {propertyTitle}
- Endereço: {propertyAddress}
- Tipo: {propertyType}
- Comodidades: {amenities}

Informações Financeiras:
- Valor do Aluguel: R$ {rentAmount}
- Valor do Depósito: R$ {depositAmount}
- Data de Início: {startDate}
- Data de Término: {endDate}

Dados do Proprietário (Locador):
- Nome: {ownerName}
- Documento: {ownerDocument}
- Email: {ownerEmail}

Dados do Inquilino (Locatário):
- Nome: {tenantName}
- Documento: {tenantDocument}
- Email: {tenantEmail}
- Renda: R$ {tenantIncome}

Termos Especiais: {specialTerms}

Gere um contrato de locação residencial/comercial completo incluindo:
1. Identificação das partes
2. Descrição do imóvel
3. Prazo e renovação
4. Valor do aluguel e reajustes
5. Obrigações do locador
6. Obrigações do locatário
7. Depósito caução
8. Vistoria
9. Benfeitorias
10. Rescisão
11. Multas
12. Disposições gerais
13. Foro

O contrato deve estar em conformidade com a Lei de Locações (Lei 8.245/91) e jurisprudência atual.
Use linguagem jurídica apropriada mas clara.
Formate o contrato de forma profissional com parágrafos numerados.
`

export class AIContractGenerator {
  private llm: ChatOpenAI
  private prompt: PromptTemplate

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.3,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    this.prompt = PromptTemplate.fromTemplate(CONTRACT_TEMPLATE)
  }

  async generateContract(data: ContractData): Promise<string> {
    try {
      const formattedPrompt = await this.prompt.format({
        propertyTitle: data.propertyTitle,
        propertyAddress: data.propertyAddress,
        propertyType: this.translatePropertyType(data.propertyType),
        rentAmount: data.rentAmount.toLocaleString('pt-BR'),
        depositAmount: data.depositAmount.toLocaleString('pt-BR'),
        startDate: new Date(data.startDate).toLocaleDateString('pt-BR'),
        endDate: new Date(data.endDate).toLocaleDateString('pt-BR'),
        ownerName: data.ownerName,
        ownerDocument: data.ownerDocument,
        ownerEmail: data.ownerEmail,
        tenantName: data.tenantName,
        tenantDocument: data.tenantDocument,
        tenantEmail: data.tenantEmail,
        tenantIncome: data.tenantIncome.toLocaleString('pt-BR'),
        amenities: data.amenities?.join(', ') || 'Não especificado',
        specialTerms: data.specialTerms || 'Nenhum termo especial',
      })

      const result = await this.llm.invoke(formattedPrompt)
      return result.content as string
    } catch (error) {
      console.error('Error generating contract:', error)
      throw new Error('Erro ao gerar contrato')
    }
  }

  private translatePropertyType(type: string): string {
    const translations = {
      'APARTMENT': 'Apartamento',
      'HOUSE': 'Casa',
      'COMMERCIAL': 'Imóvel Comercial',
      'LAND': 'Terreno',
      'STUDIO': 'Studio/Kitnet'
    }
    return translations[type as keyof typeof translations] || type
  }

  async analyzeContract(contractText: string): Promise<{
    risks: string[]
    suggestions: string[]
    compliance: string[]
  }> {
    const analysisPrompt = `
    Analise o seguinte contrato de locação e forneça:
    1. Possíveis riscos jurídicos
    2. Sugestões de melhorias
    3. Verificação de conformidade com a Lei 8.245/91

    Contrato:
    ${contractText}

    Responda em formato JSON com as chaves: risks, suggestions, compliance
    `

    try {
      const result = await this.llm.invoke(analysisPrompt)
      return JSON.parse(result.content as string)
    } catch (error) {
      console.error('Error analyzing contract:', error)
      return {
        risks: ['Erro na análise'],
        suggestions: ['Revisar manualmente'],
        compliance: ['Verificação manual necessária']
      }
    }
  }
}
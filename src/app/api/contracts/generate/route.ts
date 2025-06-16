import { NextRequest, NextResponse } from 'next/server'
import { AIContractGenerator } from '@/lib/ai-contract-generator'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const generator = new AIContractGenerator()
    const contractText = await generator.generateContract(data)
    
    return NextResponse.json({ 
      contract: contractText,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating contract:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar contrato com IA' },
      { status: 500 }
    )
  }
}
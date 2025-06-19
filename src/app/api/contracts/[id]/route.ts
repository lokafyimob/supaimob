import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        administrationFeePercentage: data.administrationFeePercentage || 10.0,
        terms: data.terms || null,
        status: data.status
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true,
        payments: true
      }
    })

    // 🚀 REGENERAR PAGAMENTOS AUTOMATICAMENTE quando atualizar contrato
    if (contract.status === 'ACTIVE') {
      console.log('📅 Regenerando pagamentos para contrato atualizado:', contract.id)
      try {
        await generatePaymentsForContract(contract.id)
        console.log('✅ Pagamentos regenerados após atualização!')
      } catch (error) {
        console.error('❌ Erro ao regenerar pagamentos:', error)
      }
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar contrato' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.contract.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Contrato deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar contrato' },
      { status: 500 }
    )
  }
}
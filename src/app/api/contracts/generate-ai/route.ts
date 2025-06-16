import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AIContractGenerator } from '@/lib/ai-contract-generator'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { propertyId, tenantId, startDate, endDate, rentAmount, depositAmount, specialTerms } = await request.json()

    // Validate required fields
    if (!propertyId || !tenantId || !startDate || !endDate || !rentAmount || !depositAmount) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: propertyId, tenantId, startDate, endDate, rentAmount, depositAmount' },
        { status: 400 }
      )
    }

    // Get property and tenant data with user verification
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: true
      }
    })

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!property || !tenant) {
      return NextResponse.json(
        { error: 'Imóvel ou inquilino não encontrado' },
        { status: 404 }
      )
    }

    // Verify that both property and tenant belong to the current user
    if (property.userId !== user.id || tenant.userId !== user.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado aos dados' },
        { status: 403 }
      )
    }

    // Parse amenities from JSON string
    let amenities: string[] = []
    try {
      amenities = property.amenities ? JSON.parse(property.amenities) : []
    } catch (error) {
      console.warn('Error parsing amenities:', error)
    }

    // Prepare contract data
    const contractData = {
      propertyTitle: property.title,
      propertyAddress: `${property.address}, ${property.city} - ${property.state}`,
      propertyType: property.propertyType,
      rentAmount: rentAmount,
      depositAmount: depositAmount,
      startDate: startDate,
      endDate: endDate,
      ownerName: property.owner.name,
      ownerDocument: property.owner.document,
      ownerEmail: property.owner.email,
      tenantName: tenant.name,
      tenantDocument: tenant.document,
      tenantEmail: tenant.email,
      tenantIncome: tenant.income,
      amenities: amenities,
      specialTerms: specialTerms || undefined
    }

    // Generate contract with AI
    const generator = new AIContractGenerator()
    const contractText = await generator.generateContract(contractData)

    // Create the contract in database
    const contract = await prisma.contract.create({
      data: {
        propertyId,
        tenantId,
        companyId: property.companyId,
        userId: user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount,
        depositAmount,
        terms: contractText
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true
      }
    })

    return NextResponse.json({
      contract,
      generatedText: contractText
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating AI contract:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Erro ao gerar contrato com IA',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
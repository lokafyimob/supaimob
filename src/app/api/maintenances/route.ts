import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const propertyId = searchParams.get('propertyId')
    
    const whereClause: any = {}
    
    if (contractId) {
      whereClause.contractId = contractId
    }
    
    if (propertyId) {
      whereClause.propertyId = propertyId
    }

    const maintenances = await prisma.maintenance.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true
              }
            }
          }
        },
        property: {
          select: {
            title: true,
            address: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(maintenances)
  } catch (error) {
    console.error('Error fetching maintenances:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar manutenções' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    console.log('Creating maintenance with data:', data)
    console.log('Amount value:', data.amount, 'Type:', typeof data.amount)
    
    // Validate required fields
    if (!data.contractId) {
      return NextResponse.json(
        { error: 'Contract ID é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!data.propertyId) {
      return NextResponse.json(
        { error: 'Property ID é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!data.title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!data.description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }
    
    if (!data.amount || isNaN(parseFloat(data.amount))) {
      return NextResponse.json(
        { error: 'Valor é obrigatório e deve ser um número válido' },
        { status: 400 }
      )
    }
    
    const maintenance = await prisma.maintenance.create({
      data: {
        contractId: data.contractId,
        propertyId: data.propertyId,
        type: data.type,
        category: data.category || 'CORRECTIVE',
        title: data.title,
        description: data.description,
        amount: data.amount ? parseFloat(data.amount) : 0,
        supplier: data.supplier || null,
        supplierContact: data.supplierContact || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'PENDING',
        images: data.images ? JSON.stringify(data.images) : null,
        receipts: data.receipts ? JSON.stringify(data.receipts) : null,
        notes: data.notes || null,
        deductFromOwner: data.deductFromOwner ?? true
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Return more detailed error information
    let errorMessage = 'Erro ao criar manutenção'
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
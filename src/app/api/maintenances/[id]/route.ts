import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
    
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
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
      }
    })

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Manutenção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error('Error fetching maintenance:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar manutenção' },
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
    const user = await requireAuth(request)
    const data = await request.json()
    
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: {
        type: data.type,
        category: data.category,
        title: data.title,
        description: data.description,
        amount: parseFloat(data.amount),
        supplier: data.supplier,
        supplierContact: data.supplierContact,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        completedDate: data.completedDate ? new Date(data.completedDate) : null,
        status: data.status,
        priority: data.priority,
        images: data.images ? JSON.stringify(data.images) : null,
        receipts: data.receipts ? JSON.stringify(data.receipts) : null,
        notes: data.notes,
        approvedBy: data.approvedBy,
        deductFromOwner: data.deductFromOwner
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

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error('Error updating maintenance:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar manutenção' },
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
    const user = await requireAuth(request)
    
    await prisma.maintenance.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Manutenção deletada com sucesso' })
  } catch (error) {
    console.error('Error deleting maintenance:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar manutenção' },
      { status: 500 }
    )
  }
}
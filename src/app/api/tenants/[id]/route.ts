import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            property: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Inquilino não encontrado' },
        { status: 404 }
      )
    }

    // Format response for SQLite compatibility
    const formattedTenant = {
      ...tenant,
      emergencyContact: tenant.emergencyContact ? 
        (typeof tenant.emergencyContact === 'string' ? JSON.parse(tenant.emergencyContact) : tenant.emergencyContact) 
        : null
    }

    return NextResponse.json(formattedTenant)
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar inquilino' },
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
    
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        income: data.income,
        occupation: data.occupation,
        emergencyContact: data.emergencyContact ? JSON.stringify(data.emergencyContact) : null
      },
      include: {
        contracts: {
          include: {
            property: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    // Format response for SQLite compatibility
    const formattedTenant = {
      ...tenant,
      emergencyContact: tenant.emergencyContact ? JSON.parse(tenant.emergencyContact) : null
    }

    return NextResponse.json(formattedTenant)
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar inquilino' },
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
    
    await prisma.tenant.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Inquilino deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar inquilino' },
      { status: 500 }
    )
  }
}
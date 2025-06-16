import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const tenants = await prisma.tenant.findMany({
      where: {
        userId: user.id
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format emergency contact data for SQLite compatibility
    const formattedTenants = tenants.map(tenant => ({
      ...tenant,
      emergencyContact: tenant.emergencyContact ? 
        (typeof tenant.emergencyContact === 'string' ? JSON.parse(tenant.emergencyContact) : tenant.emergencyContact) 
        : null
    }))

    return NextResponse.json(formattedTenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar inquilinos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    const tenant = await prisma.tenant.create({
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
        emergencyContact: data.emergencyContact ? JSON.stringify(data.emergencyContact) : null,
        companyId: user.companyId || '',
        userId: user.id
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
      emergencyContact: tenant.emergencyContact ? 
        (typeof tenant.emergencyContact === 'string' ? JSON.parse(tenant.emergencyContact) : tenant.emergencyContact) 
        : null
    }

    return NextResponse.json(formattedTenant, { status: 201 })
  } catch (error) {
    console.error('Error creating tenant:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar inquilino', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
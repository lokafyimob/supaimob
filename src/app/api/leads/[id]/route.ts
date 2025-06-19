import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request)
    
    const lead = await prisma.lead.findFirst({
      where: { 
        id,
        userId: user.id 
      },
      include: {
        matchedProperty: true,
        notifications: {
          include: {
            property: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar lead' },
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
    
    const lead = await prisma.lead.update({
      where: { 
        id,
        userId: user.id 
      },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document || null,
        interest: data.interest,
        propertyType: data.propertyType,
        minPrice: data.minPrice || null,
        maxPrice: data.maxPrice,
        minBedrooms: data.minBedrooms || null,
        maxBedrooms: data.maxBedrooms || null,
        minBathrooms: data.minBathrooms || null,
        maxBathrooms: data.maxBathrooms || null,
        minArea: data.minArea || null,
        maxArea: data.maxArea || null,
        preferredCities: JSON.stringify(data.preferredCities || []),
        preferredStates: JSON.stringify(data.preferredStates || []),
        amenities: data.amenities ? JSON.stringify(data.amenities) : null,
        notes: data.notes || null,
        status: data.status,
        lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
        matchedPropertyId: data.matchedPropertyId || null
      },
      include: {
        matchedProperty: true,
        notifications: {
          include: {
            property: true
          }
        }
      }
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
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
    
    // Delete related notifications first
    await prisma.leadNotification.deleteMany({
      where: { leadId: id }
    })
    
    // Then delete the lead
    await prisma.lead.delete({
      where: { 
        id,
        userId: user.id 
      }
    })

    return NextResponse.json({ message: 'Lead deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar lead' },
      { status: 500 }
    )
  }
}
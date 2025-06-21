import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    console.log('Test lead creation with minimal data:', data)
    
    // Get user's company
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true }
    })

    if (!userData?.companyId) {
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    // Create with only essential fields
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        interest: data.interest || 'RENT',
        propertyType: data.propertyType || 'APARTMENT',
        maxPrice: data.maxPrice || 1000,
        preferredCities: JSON.stringify([]),
        preferredStates: JSON.stringify([]),
        status: 'ACTIVE',
        companyId: userData.companyId,
        userId: user.id,
        needsFinancing: false
      }
    })
    
    console.log('Test lead created successfully:', lead.id)
    return NextResponse.json({ success: true, lead }, { status: 201 })
    
  } catch (error) {
    console.error('Test lead creation error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
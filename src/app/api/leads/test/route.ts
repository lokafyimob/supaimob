import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('=== STARTING TEST LEAD CREATION ===')
    
    // Test authentication first
    let user;
    try {
      user = await requireAuth(request)
      console.log('✅ Auth successful, user ID:', user.id)
    } catch (authError) {
      console.error('❌ Auth failed:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError instanceof Error ? authError.message : 'Unknown auth error' }, { status: 401 })
    }
    
    // Test JSON parsing
    let data;
    try {
      data = await request.json()
      console.log('✅ JSON parsed successfully:', data)
    } catch (jsonError) {
      console.error('❌ JSON parsing failed:', jsonError)
      return NextResponse.json({ error: 'Invalid JSON', details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error' }, { status: 400 })
    }
    
    // Test database connection and user lookup
    let userData;
    try {
      userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true, email: true }
      })
      console.log('✅ User data found:', userData)
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError)
      return NextResponse.json({ error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown DB error' }, { status: 500 })
    }

    if (!userData?.companyId) {
      console.error('❌ No company ID found for user')
      return NextResponse.json({ error: 'User company not found' }, { status: 400 })
    }

    // Test lead creation with absolute minimum fields
    try {
      console.log('🔄 Attempting to create lead with minimal data...')
      
      const leadData = {
        name: String(data.name || 'Test Lead'),
        email: String(data.email || 'test@test.com'),
        phone: String(data.phone || '11999999999'),
        interest: 'RENT',
        propertyType: 'APARTMENT',
        maxPrice: 1000.0,
        preferredCities: '[]',
        preferredStates: '[]',
        status: 'ACTIVE',
        companyId: userData.companyId,
        userId: user.id,
        needsFinancing: false
      }
      
      console.log('Lead data prepared:', JSON.stringify(leadData, null, 2))
      
      const lead = await prisma.lead.create({
        data: leadData
      })
      
      console.log('✅ Lead created successfully with ID:', lead.id)
      return NextResponse.json({ success: true, lead, message: 'Lead created successfully' }, { status: 201 })
      
    } catch (createError) {
      console.error('❌ Lead creation failed:', createError)
      return NextResponse.json({ 
        error: 'Lead creation failed', 
        details: createError instanceof Error ? createError.message : 'Unknown creation error',
        stack: createError instanceof Error ? createError.stack : undefined
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in test endpoint:', error)
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
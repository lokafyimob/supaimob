import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const debugInfo: Record<string, any> = {
    step: 'starting',
    timestamp: new Date().toISOString(),
    errors: []
  }
  
  try {
    debugInfo.step = 'testing-database'
    
    // Teste 1: Acessar banco
    try {
      const userCount = await prisma.user.count()
      debugInfo.database = { accessible: true, userCount }
    } catch (dbError) {
      debugInfo.database = { 
        accessible: false, 
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error' 
      }
      debugInfo.errors.push(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`)
    }
    
    debugInfo.step = 'authenticating'
    
    // Teste 2: Autenticação
    let user: Record<string, any>
    try {
      user = await requireAuth(request)
      debugInfo.auth = { 
        success: true, 
        userId: user.id, 
        userEmail: user.email, 
        companyId: user.companyId 
      }
    } catch (authError) {
      debugInfo.auth = { 
        success: false, 
        error: authError instanceof Error ? authError.message : 'Unknown auth error' 
      }
      debugInfo.errors.push(`Auth error: ${authError instanceof Error ? authError.message : 'Unknown'}`)
      return NextResponse.json(debugInfo, { status: 500 })
    }
    
    debugInfo.step = 'parsing-data'
    
    // Teste 3: Parse dos dados
    let data: Record<string, any>
    try {
      data = await request.json()
      debugInfo.requestData = data
    } catch (parseError) {
      debugInfo.parseError = parseError instanceof Error ? parseError.message : 'Unknown parse error'
      debugInfo.errors.push(`Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}`)
      return NextResponse.json(debugInfo, { status: 500 })
    }
    
    debugInfo.step = 'validating-fields'
    
    // Teste 4: Validação
    const missingFields = []
    if (!data.name) missingFields.push('name')
    if (!data.email) missingFields.push('email') 
    if (!data.phone) missingFields.push('phone')
    if (!data.document) missingFields.push('document')
    
    debugInfo.validation = {
      missingFields,
      valid: missingFields.length === 0
    }
    
    if (missingFields.length > 0) {
      debugInfo.errors.push(`Missing fields: ${missingFields.join(', ')}`)
      return NextResponse.json(debugInfo, { status: 400 })
    }
    
    debugInfo.step = 'checking-company'
    
    // Teste 5: Verificar company
    if (!user.companyId) {
      debugInfo.errors.push('User has no companyId')
      return NextResponse.json(debugInfo, { status: 400 })
    }
    
    debugInfo.step = 'checking-duplicates'
    
    // Teste 6: Verificar duplicatas
    try {
      const existingOwner = await prisma.owner.findFirst({
        where: {
          OR: [
            { email: data.email },
            { document: data.document }
          ]
        }
      })
      
      debugInfo.duplicateCheck = {
        found: !!existingOwner,
        existingId: existingOwner?.id || null
      }
      
      if (existingOwner) {
        debugInfo.errors.push(`Duplicate found: ${existingOwner.id}`)
        return NextResponse.json(debugInfo, { status: 400 })
      }
    } catch (checkError) {
      debugInfo.duplicateCheckError = checkError instanceof Error ? checkError.message : 'Unknown check error'
      debugInfo.errors.push(`Duplicate check error: ${checkError instanceof Error ? checkError.message : 'Unknown'}`)
      return NextResponse.json(debugInfo, { status: 500 })
    }
    
    debugInfo.step = 'creating-owner'
    
    // Teste 7: Criar owner
    const ownerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      document: data.document,
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: data.zipCode || '',
      companyId: user.companyId,
      userId: user.id
    }
    
    debugInfo.ownerData = ownerData
    
    try {
      const owner = await prisma.owner.create({
        data: ownerData
      })
      
      debugInfo.step = 'success'
      debugInfo.createdOwner = { id: owner.id, name: owner.name }
      
      return NextResponse.json({
        success: true,
        owner,
        debug: debugInfo
      }, { status: 201 })
      
    } catch (createError) {
      debugInfo.createError = {
        message: createError instanceof Error ? createError.message : 'Unknown create error',
        name: createError instanceof Error ? createError.name : 'Unknown',
        stack: createError instanceof Error ? createError.stack : 'No stack'
      }
      debugInfo.errors.push(`Create error: ${createError instanceof Error ? createError.message : 'Unknown'}`)
      return NextResponse.json(debugInfo, { status: 500 })
    }
    
  } catch (globalError) {
    debugInfo.globalError = {
      message: globalError instanceof Error ? globalError.message : 'Unknown global error',
      name: globalError instanceof Error ? globalError.name : 'Unknown',
      stack: globalError instanceof Error ? globalError.stack : 'No stack'
    }
    debugInfo.errors.push(`Global error: ${globalError instanceof Error ? globalError.message : 'Unknown'}`)
    
    return NextResponse.json(debugInfo, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing authentication flow...')
    
    const { email, password } = await request.json()
    
    console.log('📧 Login attempt:', email)
    
    // Simular exatamente o que acontece no NextAuth
    if (email === 'teste@crm.com' && password === 'test123') {
      console.log('🔧 Creating test user on demand...')
      
      // Criar company se não existir
      let company = await prisma.company.findFirst({
        where: { document: '11.222.333/0001-44' }
      }).catch(async (error) => {
        console.log('⚠️ Company table might not exist, creating...')
        // Se tabela não existe, tentar criar com schema push
        return null
      })
      
      if (!company) {
        try {
          company = await prisma.company.create({
            data: {
              name: 'Imobiliária Demo',
              tradeName: 'Demo CRM',
              document: '11.222.333/0001-44',
              email: 'demo@crm.com',
              phone: '(11) 1234-5678',
              address: 'Rua Demo, 123',
              city: 'São Paulo',
              state: 'SP',
              zipCode: '01234-567',
              active: true,
              subscription: 'PREMIUM'
            }
          })
          console.log('✅ Company created:', company.name)
        } catch (companyError) {
          console.error('❌ Error creating company:', companyError)
          return NextResponse.json({ 
            success: false, 
            error: 'Company creation failed',
            details: companyError instanceof Error ? companyError.message : 'Unknown error'
          }, { status: 500 })
        }
      }
      
      // Criar usuário
      const hashedPassword = await bcrypt.hash('test123', 10)
      
      try {
        const user = await prisma.user.upsert({
          where: { email: 'teste@crm.com' },
          update: {
            password: hashedPassword,
            companyId: company.id,
            isActive: true,
            isBlocked: false
          },
          create: {
            email: 'teste@crm.com',
            name: 'Usuário Teste',
            password: hashedPassword,
            role: 'USER',
            companyId: company.id,
            isActive: true,
            isBlocked: false
          },
          include: {
            company: true
          }
        })
        
        console.log('✅ User created/updated:', user.email)
        
        // Testar senha
        const isPasswordValid = await bcrypt.compare('test123', user.password)
        console.log('🔑 Password valid:', isPasswordValid)
        
        return NextResponse.json({
          success: true,
          message: 'Authentication test successful',
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            companyName: user.company?.name
          },
          passwordTest: isPasswordValid
        })
        
      } catch (userError) {
        console.error('❌ Error with user:', userError)
        return NextResponse.json({ 
          success: false, 
          error: 'User creation/update failed',
          details: userError instanceof Error ? userError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid credentials provided',
      receivedEmail: email,
      expectedEmail: 'teste@crm.com'
    }, { status: 401 })
    
  } catch (error) {
    console.error('❌ Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
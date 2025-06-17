import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔐 Simple login attempt:', email)
    
    // Para o usuário teste, criar automaticamente se não existir
    if (email === 'teste@crm.com' && password === 'test123') {
      // Forçar criação das tabelas e dados
      try {
        // Primeiro, verificar/criar company
        let company = await prisma.company.findFirst({
          where: { document: '11.222.333/0001-44' }
        })
        
        if (!company) {
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
        }
        
        // Verificar/criar usuário
        const hashedPassword = await bcrypt.hash('test123', 10)
        
        const user = await prisma.user.upsert({
          where: { email: 'teste@crm.com' },
          update: {
            password: hashedPassword,
            companyId: company.id
          },
          create: {
            email: 'teste@crm.com',
            name: 'Usuário Teste',
            password: hashedPassword,
            role: 'USER',
            companyId: company.id,
            isActive: true,
            isBlocked: false
          }
        })
        
        // Criar token JWT simples
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email, 
            companyId: user.companyId 
          },
          process.env.NEXTAUTH_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        )
        
        // Criar resposta com cookie
        const response = NextResponse.json({
          success: true,
          message: 'Login realizado com sucesso!',
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId
          },
          redirectUrl: '/dashboard'
        })
        
        // Definir cookie de sessão
        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 dias
        })
        
        return response
        
      } catch (dbError) {
        console.error('❌ Database error:', dbError)
        return NextResponse.json({
          success: false,
          error: 'Erro no banco de dados',
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Credenciais inválidas'
    }, { status: 401 })
    
  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
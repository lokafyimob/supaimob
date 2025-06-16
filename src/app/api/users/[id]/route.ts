import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params

    // Preparar dados para atualização
    const updateData: any = {
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      isBlocked: data.isBlocked
    }

    // Apenas atualizar senha se fornecida
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }

    // Atualizar companyId se fornecido
    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId || null
    }

    // Criar nova empresa se necessário
    if (data.companyData) {
      const company = await prisma.company.create({
        data: {
          name: data.companyData.name,
          tradeName: data.companyData.tradeName,
          document: data.companyData.document,
          email: data.companyData.email,
          phone: data.companyData.phone,
          address: data.companyData.address,
          city: data.companyData.city,
          state: data.companyData.state,
          zipCode: data.companyData.zipCode
        }
      })
      updateData.companyId = company.id
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            tradeName: true
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}
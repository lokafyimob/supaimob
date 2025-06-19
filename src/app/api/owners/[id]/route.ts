import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        properties: true,
        bankAccount: true
      }
    })

    if (!owner) {
      return NextResponse.json(
        { error: 'Proprietário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error fetching owner:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar proprietário' },
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
    
    // First, handle bank account separately if needed
    if (data.bankAccount) {
      const existingOwner = await prisma.owner.findUnique({
        where: { id },
        include: { bankAccount: true }
      })

      if (existingOwner?.bankAccount) {
        // Update existing bank account
        await prisma.bankAccount.update({
          where: { ownerId: id },
          data: {
            bankName: data.bankAccount.bankName,
            accountType: data.bankAccount.accountType,
            agency: data.bankAccount.agency,
            account: data.bankAccount.account,
            pixKey: data.bankAccount.pixKey
          }
        })
      } else {
        // Create new bank account
        await prisma.bankAccount.create({
          data: {
            ownerId: id,
            bankName: data.bankAccount.bankName,
            accountType: data.bankAccount.accountType,
            agency: data.bankAccount.agency,
            account: data.bankAccount.account,
            pixKey: data.bankAccount.pixKey
          }
        })
      }
    } else {
      // Remove bank account if it exists and data.bankAccount is null
      await prisma.bankAccount.deleteMany({
        where: { ownerId: id }
      })
    }

    // Update owner data
    const owner = await prisma.owner.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        document: data.document,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode
      },
      include: {
        properties: true,
        bankAccount: true
      }
    })

    return NextResponse.json(owner)
  } catch (error) {
    console.error('Error updating owner:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar proprietário' },
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
    
    // First delete bank account if it exists
    await prisma.bankAccount.deleteMany({
      where: { ownerId: id }
    })
    
    // Then delete the owner
    await prisma.owner.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Proprietário deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting owner:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar proprietário' },
      { status: 500 }
    )
  }
}
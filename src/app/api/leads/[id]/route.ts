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
    
    console.log('Updating lead with raw SQL:', id, data)
    
    // Use raw SQL for update (same approach as GET)
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // First verify the lead belongs to the user
    const checkQuery = 'SELECT id FROM leads WHERE id = $1 AND "userId" = $2'
    const checkResult = await client.query(checkQuery, [id, user.id])
    
    if (checkResult.rows.length === 0) {
      await client.end()
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }
    
    // Update the lead
    const updateQuery = `
      UPDATE leads SET 
        name = $1,
        email = $2,
        phone = $3,
        document = $4,
        interest = $5,
        "propertyType" = $6,
        "minPrice" = $7,
        "maxPrice" = $8,
        "minBedrooms" = $9,
        "maxBedrooms" = $10,
        "minBathrooms" = $11,
        "maxBathrooms" = $12,
        "minArea" = $13,
        "maxArea" = $14,
        "preferredCities" = $15,
        "preferredStates" = $16,
        amenities = $17,
        notes = $18,
        status = $19,
        "lastContactDate" = $20,
        "needsFinancing" = $21,
        "updatedAt" = NOW()
      WHERE id = $22 AND "userId" = $23
      RETURNING *
    `
    
    const values = [
      data.name,
      data.email,
      data.phone,
      data.document || null,
      data.interest,
      data.propertyType,
      data.minPrice || null,
      data.maxPrice,
      data.minBedrooms || null,
      data.maxBedrooms || null,
      data.minBathrooms || null,
      data.maxBathrooms || null,
      data.minArea || null,
      data.maxArea || null,
      JSON.stringify((data.preferredCities || []).filter((city: string) => city && city.trim()).map((city: string) => city.toUpperCase())),
      JSON.stringify(Array.isArray(data.preferredStates) ? data.preferredStates : []),
      data.amenities ? JSON.stringify(data.amenities) : null,
      data.notes || null,
      data.status,
      data.lastContactDate ? new Date(data.lastContactDate) : null,
      data.needsFinancing || false,
      id,
      user.id
    ]
    
    const result = await client.query(updateQuery, values)
    await client.end()
    
    console.log('Lead updated successfully:', result.rows[0].id)
    
    // Execute automatic notification system for the updated lead
    try {
      console.log('🔔 Lead editado, executando notificações automáticas...')
      console.log('📋 Lead atualizado ID:', result.rows[0].id)
      
      const { notifyLeadChanges } = require('@/lib/lead-change-notifier')
      const notificationResult = await notifyLeadChanges(result.rows[0].id, 'updated')
      console.log('✅ Notificações automáticas de lead executadas:', notificationResult)
      
      if (notificationResult?.notificationsCreated > 0) {
        console.log(`🎯 ${notificationResult.notificationsCreated} notificações atualizadas para lead: ${notificationResult.leadName}`)
      } else {
        console.log('🔍 Nenhuma notificação atualizada para lead editado')
      }
      
    } catch (notificationError) {
      console.log('❌ Erro nas notificações automáticas de lead:', notificationError)
      console.log('📝 Stack trace:', notificationError instanceof Error ? notificationError.stack : 'N/A')
    }
    
    return NextResponse.json(result.rows[0])
    
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar lead', details: error instanceof Error ? error.message : 'Unknown error' },
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
    
    console.log(`🗑️ Deletando lead: ${id} do usuário: ${user.id}`)
    
    // Use raw SQL to avoid foreign key constraints
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // Start transaction
      await client.query('BEGIN')
      
      // First verify the lead belongs to the user
      const checkQuery = 'SELECT id FROM leads WHERE id = $1 AND "userId" = $2'
      const checkResult = await client.query(checkQuery, [id, user.id])
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK')
        await client.end()
        return NextResponse.json({ error: 'Lead não encontrado ou não autorizado' }, { status: 404 })
      }
      
      // Delete in the correct order to avoid foreign key violations
      
      // 1. Delete partnership notifications
      const deletePartnershipNotifQuery = 'DELETE FROM partnership_notifications WHERE "leadId" = $1'
      const partnershipResult = await client.query(deletePartnershipNotifQuery, [id])
      console.log(`🗑️ ${partnershipResult.rowCount} partnership_notifications deletadas`)
      
      // 2. Delete lead notifications
      const deleteLeadNotifQuery = 'DELETE FROM lead_notifications WHERE "leadId" = $1'
      const notifResult = await client.query(deleteLeadNotifQuery, [id])
      console.log(`🗑️ ${notifResult.rowCount} lead_notifications deletadas`)
      
      // 3. Delete the lead itself
      const deleteLeadQuery = 'DELETE FROM leads WHERE id = $1 AND "userId" = $2'
      const leadResult = await client.query(deleteLeadQuery, [id, user.id])
      console.log(`🗑️ ${leadResult.rowCount} lead deletado`)
      
      // Commit the transaction
      await client.query('COMMIT')
      await client.end()
      
      if (leadResult.rowCount === 0) {
        return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
      }

      return NextResponse.json({ 
        message: 'Lead deletado com sucesso',
        deletedNotifications: notifResult.rowCount,
        deletedPartnerships: partnershipResult.rowCount
      })
      
    } catch (dbError) {
      // Rollback transaction on error
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError)
      }
      await client.end()
      throw dbError
    }
    
  } catch (error) {
    console.error('❌ Error deleting lead:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao deletar lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
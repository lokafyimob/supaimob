import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting comprehensive database migration...')
    
    const migrations = []
    
    try {
      // Make companyId nullable in owners table
      await prisma.$executeRaw`ALTER TABLE owners ALTER COLUMN "companyId" DROP NOT NULL`
      migrations.push('✅ Made owners.companyId nullable')
    } catch (e) {
      migrations.push('⚠️ owners.companyId already nullable or failed')
    }
    
    try {
      // Add missing columns to properties table
      await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "images" TEXT DEFAULT '[]'`
      migrations.push('✅ Added properties.images column')
    } catch (e) {
      migrations.push('⚠️ properties.images already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "amenities" TEXT DEFAULT '[]'`
      migrations.push('✅ Added properties.amenities column')
    } catch (e) {
      migrations.push('⚠️ properties.amenities already exists or failed')
    }
    
    try {
      // Add missing columns to contracts table
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "condominiumDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Added contracts.condominiumDeductible column')
    } catch (e) {
      migrations.push('⚠️ contracts.condominiumDeductible already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "maintenanceDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Added contracts.maintenanceDeductible column')
    } catch (e) {
      migrations.push('⚠️ contracts.maintenanceDeductible already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE contracts ADD COLUMN IF NOT EXISTS "iptuDeductible" BOOLEAN DEFAULT true`
      migrations.push('✅ Added contracts.iptuDeductible column')
    } catch (e) {
      migrations.push('⚠️ contracts.iptuDeductible already exists or failed')
    }
    
    try {
      // Add missing columns to payments table
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoUrl" TEXT`
      migrations.push('✅ Added payments.boletoUrl column')
    } catch (e) {
      migrations.push('⚠️ payments.boletoUrl already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "boletoCode" TEXT`
      migrations.push('✅ Added payments.boletoCode column')
    } catch (e) {
      migrations.push('⚠️ payments.boletoCode already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "penalty" REAL`
      migrations.push('✅ Added payments.penalty column')
    } catch (e) {
      migrations.push('⚠️ payments.penalty already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "interest" REAL`
      migrations.push('✅ Added payments.interest column')
    } catch (e) {
      migrations.push('⚠️ payments.interest already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "receipts" TEXT`
      migrations.push('✅ Added payments.receipts column')
    } catch (e) {
      migrations.push('⚠️ payments.receipts already exists or failed')
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "notes" TEXT`
      migrations.push('✅ Added payments.notes column')
    } catch (e) {
      migrations.push('⚠️ payments.notes already exists or failed')
    }
    
    console.log('Migration results:', migrations)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed', 
      results: migrations
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
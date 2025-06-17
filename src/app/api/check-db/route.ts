import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database structure...')
    
    // Verificar se as tabelas existem e contam registros
    const checks = {
      users: { exists: false, count: 0 },
      companies: { exists: false, count: 0 },
      owners: { exists: false, count: 0 },
      tenants: { exists: false, count: 0 },
      properties: { exists: false, count: 0 },
      contracts: { exists: false, count: 0 }
    }
    
    try {
      checks.users.count = await prisma.user.count()
      checks.users.exists = true
      console.log('✅ Users table exists, count:', checks.users.count)
    } catch (error) {
      console.error('❌ Users table error:', error instanceof Error ? error.message : error)
    }
    
    try {
      checks.companies.count = await prisma.company.count()
      checks.companies.exists = true
      console.log('✅ Companies table exists, count:', checks.companies.count)
    } catch (error) {
      console.error('❌ Companies table error:', error instanceof Error ? error.message : error)
    }
    
    try {
      checks.owners.count = await prisma.owner.count()
      checks.owners.exists = true
      console.log('✅ Owners table exists, count:', checks.owners.count)
    } catch (error) {
      console.error('❌ Owners table error:', error instanceof Error ? error.message : error)
    }
    
    try {
      checks.tenants.count = await prisma.tenant.count()
      checks.tenants.exists = true
      console.log('✅ Tenants table exists, count:', checks.tenants.count)
    } catch (error) {
      console.error('❌ Tenants table error:', error instanceof Error ? error.message : error)
    }
    
    try {
      checks.properties.count = await prisma.property.count()
      checks.properties.exists = true
      console.log('✅ Properties table exists, count:', checks.properties.count)
    } catch (error) {
      console.error('❌ Properties table error:', error instanceof Error ? error.message : error)
    }
    
    try {
      checks.contracts.count = await prisma.contract.count()
      checks.contracts.exists = true
      console.log('✅ Contracts table exists, count:', checks.contracts.count)
    } catch (error) {
      console.error('❌ Contracts table error:', error instanceof Error ? error.message : error)
    }
    
    // Verificar usuário admin
    let adminUser = null
    try {
      adminUser = await prisma.user.findUnique({
        where: { email: 'admin@crm.com' },
        include: { company: true }
      })
      console.log('👤 Admin user found:', !!adminUser)
    } catch (error) {
      console.error('❌ Error finding admin user:', error instanceof Error ? error.message : error)
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tables: checks,
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        companyId: adminUser.companyId,
        companyName: adminUser.company?.name
      } : null,
      database: {
        provider: 'sqlite',
        connected: true
      }
    })
    
  } catch (error) {
    console.error('💥 Database check failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    
    let whereClause: any = {}
    
    if (contractId) {
      whereClause.contractId = contractId
    }
    
    if (month) {
      whereClause.month = parseInt(month)
    }
    
    if (year) {
      whereClause.year = parseInt(year)
    }

    const reports = await prisma.monthlyReport.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching monthly reports:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios mensais' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const data = await request.json()
    
    // Calculate totals
    const grossAmount = parseFloat(data.rentAmount)
    const administrationFee = grossAmount * (parseFloat(data.administrationFeePercentage) / 100)
    const managementFee = grossAmount * (parseFloat(data.managementFeePercentage) / 100)
    const totalDeductions = administrationFee + managementFee + 
                           parseFloat(data.maintenanceCosts || 0) +
                           parseFloat(data.iptuCosts || 0) +
                           parseFloat(data.condominiumCosts || 0) +
                           parseFloat(data.otherDeductions || 0)
    const netAmount = grossAmount - totalDeductions
    
    const report = await prisma.monthlyReport.create({
      data: {
        contractId: data.contractId,
        propertyId: data.propertyId,
        month: parseInt(data.month),
        year: parseInt(data.year),
        rentAmount: grossAmount,
        administrationFee: administrationFee,
        managementFee: managementFee,
        maintenanceCosts: parseFloat(data.maintenanceCosts || 0),
        iptuCosts: parseFloat(data.iptuCosts || 0),
        condominiumCosts: parseFloat(data.condominiumCosts || 0),
        otherDeductions: parseFloat(data.otherDeductions || 0),
        grossAmount: grossAmount,
        totalDeductions: totalDeductions,
        netAmount: netAmount
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating monthly report:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar relatório mensal' },
      { status: 500 }
    )
  }
}

// Generate monthly report automatically
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    
    if (!contractId || !month || !year) {
      return NextResponse.json(
        { error: 'contractId, month e year são obrigatórios' },
        { status: 400 }
      )
    }

    // Get contract details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        maintenances: {
          where: {
            createdAt: {
              gte: new Date(year, month - 1, 1),
              lt: new Date(year, month, 1)
            },
            status: 'COMPLETED',
            deductFromOwner: true
          }
        }
      }
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Calculate maintenance costs for the month
    const maintenanceCosts = contract.maintenances.reduce(
      (sum, maintenance) => sum + maintenance.amount, 0
    )

    // Calculate fees - correct formula: Aluguel Bruto - Taxa Adm - Manutenções = Valor Líquido
    const grossAmount = contract.rentAmount
    const administrationFee = grossAmount * (contract.administrationFeePercentage / 100)
    const managementFee = grossAmount * (contract.managementFeePercentage / 100)
    
    // Net amount = Gross - Admin Fee ONLY - Maintenance Costs
    const totalDeductions = administrationFee + maintenanceCosts
    const netAmount = grossAmount - totalDeductions

    // Check if report already exists
    const existingReport = await prisma.monthlyReport.findUnique({
      where: {
        contractId_month_year: {
          contractId,
          month,
          year
        }
      }
    })

    let report
    if (existingReport) {
      // Update existing report
      report = await prisma.monthlyReport.update({
        where: { id: existingReport.id },
        data: {
          rentAmount: grossAmount,
          administrationFee,
          managementFee,
          maintenanceCosts,
          iptuCosts: 0,
          condominiumCosts: 0,
          otherDeductions: 0,
          grossAmount,
          totalDeductions,
          netAmount,
          reportGenerated: true
        },
        include: {
          contract: {
            include: {
              property: {
                select: {
                  title: true,
                  address: true
                }
              },
              tenant: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    } else {
      // Create new report
      report = await prisma.monthlyReport.create({
        data: {
          contractId,
          propertyId: contract.propertyId,
          month,
          year,
          rentAmount: grossAmount,
          administrationFee,
          managementFee,
          maintenanceCosts,
          iptuCosts: 0,
          condominiumCosts: 0,
          otherDeductions: 0,
          grossAmount,
          totalDeductions,
          netAmount,
          reportGenerated: true
        },
        include: {
          contract: {
            include: {
              property: {
                select: {
                  title: true,
                  address: true
                }
              },
              tenant: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating monthly report:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório mensal' },
      { status: 500 }
    )
  }
}
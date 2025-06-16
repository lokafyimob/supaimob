import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function withTenantIsolation(
  request: NextRequest,
  handler: (request: NextRequest, companyId: string) => Promise<NextResponse>
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user company from token
    const companyId = token.companyId as string
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company not found for user' },
        { status: 403 }
      )
    }

    return handler(request, companyId)
  } catch (error) {
    console.error('Tenant isolation middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export function addCompanyFilter(where: any = {}, companyId: string) {
  return {
    ...where,
    companyId
  }
}

export function addCompanyInclude(include: any = {}) {
  return {
    ...include,
    company: {
      select: {
        id: true,
        name: true,
        subscription: true
      }
    }
  }
}
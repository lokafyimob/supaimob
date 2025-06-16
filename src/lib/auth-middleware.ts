import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getUserFromRequest(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }
  
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    companyId: session.user.companyId
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}
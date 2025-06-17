import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 Auth attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              company: true
            }
          })

          console.log('🔍 User found:', !!user, user?.email)

          if (!user) {
            console.log('❌ User not found')
            return null
          }

        // Verificar se usuário está bloqueado ou inativo
        if (user.isBlocked) {
          throw new Error('Usuário bloqueado. Entre em contato com o administrador.')
        }

        if (!user.isActive) {
          throw new Error('Usuário inativo. Entre em contato com o administrador.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('🔍 Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }

        // Atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        console.log('✅ Login successful for:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId || undefined,
          companyName: user.company?.name || undefined
        }
        } catch (error) {
          console.log('❌ Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.companyId = (user as any).companyId
        token.companyName = (user as any).companyName
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.companyId = token.companyId
        session.user.companyName = token.companyName
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login'
  }
}
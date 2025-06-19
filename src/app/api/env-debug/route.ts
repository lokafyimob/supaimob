import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + '...',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || key.includes('PRISMA')
    )
  })
}
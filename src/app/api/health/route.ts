import { NextResponse } from 'next/server'
import { ensureDbInitialized } from '@/lib/init-db'

export async function GET() {
  // Garantir que o banco está inicializado na primeira chamada
  try {
    await ensureDbInitialized()
  } catch (error) {
    console.log('Health check - erro na inicialização:', error)
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  })
}
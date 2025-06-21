import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API Upload chamada')
    console.log('🔍 Headers:', Object.fromEntries(request.headers.entries()))
    
    // Verificar autenticação com tratamento melhor de erros
    let user
    try {
      user = await requireAuth(request)
      console.log('👤 Usuário autenticado:', user.email)
    } catch (authError) {
      console.error('❌ Erro de autenticação:', authError)
      return NextResponse.json(
        { error: 'Não autorizado - faça login primeiro' },
        { status: 401 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('❌ Nenhum arquivo enviado')
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    console.log('📎 Arquivo recebido:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Tipo não permitido:', file.type)
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.' },
        { status: 400 }
      )
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ Arquivo muito grande:', file.size)
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    // Converter para base64 (solução compatível com Vercel)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    
    // Criar data URL
    const dataUrl = `data:${file.type};base64,${base64}`
    
    // Gerar ID único para o arquivo
    const timestamp = Date.now()
    const fileId = `receipt_${user.id}_${timestamp}`

    console.log('✅ Arquivo convertido para base64:', {
      fileId,
      size: file.size,
      type: file.type,
      base64Length: base64.length
    })

    console.log('🎉 Upload processado com sucesso!')
    
    return NextResponse.json({
      success: true,
      url: dataUrl, // Data URL pode ser usado diretamente
      fileId,
      filename: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('❌ Erro no upload:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Log específico do tipo de erro
    if (error instanceof Error) {
      console.error('❌ Error name:', error.name)
      console.error('❌ Error message:', error.message)
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
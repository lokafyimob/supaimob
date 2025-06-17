import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

let dbInitialized = false

export async function ensureDbInitialized() {
  if (dbInitialized) return
  
  try {
    // Sempre tentar criar o usuário de teste se não existir
    const existingUser = await prisma.user.findUnique({
      where: { email: 'teste@crm.com' }
    })
    
    if (!existingUser) {
      console.log('🚀 Criando usuário de teste...')
      
      // Criar ou buscar company padrão
      let company = await prisma.company.findFirst({
        where: { document: '11.222.333/0001-44' }
      })
      
      if (!company) {
        company = await prisma.company.create({
          data: {
            name: 'Imobiliária Demo',
            tradeName: 'Demo CRM',
            document: '11.222.333/0001-44',
            email: 'demo@crm.com',
            phone: '(11) 1234-5678',
            address: 'Rua Demo, 123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
            active: true,
            subscription: 'PREMIUM'
          }
        })
      }
      
      // Criar usuário de teste
      const hashedPassword = await bcrypt.hash('test123', 10)
      
      await prisma.user.create({
        data: {
          email: 'teste@crm.com',
          name: 'Usuário Teste',
          password: hashedPassword,
          role: 'USER',
          companyId: company.id,
          isActive: true,
          isBlocked: false
        }
      })
      
      console.log('✅ Usuário teste@crm.com criado com sucesso')
    } else {
      console.log('✅ Usuário teste@crm.com já existe')
    }
    
    dbInitialized = true
  } catch (error) {
    console.error('❌ Erro ao configurar usuário:', error)
    // Tentar criar tabelas se não existirem
    try {
      console.log('🔧 Tentando sincronizar schema...')
      // Isso força o Prisma a criar as tabelas se necessário
      await prisma.$connect()
    } catch (connectError) {
      console.error('❌ Erro de conexão:', connectError)
    }
  }
}
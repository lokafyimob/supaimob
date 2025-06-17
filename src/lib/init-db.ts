import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

let dbInitialized = false

export async function ensureDbInitialized() {
  if (dbInitialized) return
  
  try {
    // Testar se o banco existe e tem dados
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      console.log('🚀 Inicializando banco de dados...')
      
      // Criar company padrão
      const company = await prisma.company.create({
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
      
      console.log('✅ Banco inicializado com usuário teste@crm.com')
    }
    
    dbInitialized = true
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error)
    // Não falhar, apenas logar o erro
  }
}
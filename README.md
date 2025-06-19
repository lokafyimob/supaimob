# 🏢 CRM Imobiliário - Sistema Inteligente de Gestão

Um sistema completo de CRM para o setor imobiliário com funcionalidades avançadas de IA, geração automática de contratos e detecção de inadimplência.

## ✨ Funcionalidades Principais

### 🏠 Gestão de Imóveis
- Cadastro completo de imóveis (apartamentos, casas, comerciais, terrenos)
- Upload de imagens e galeria
- Filtros avançados de busca
- Status de disponibilidade em tempo real
- Histórico de transações

### 👥 Gestão de Pessoas
- **Proprietários**: Cadastro com dados bancários para repasse
- **Inquilinos**: Controle de renda e histórico de pagamentos
- **Usuários**: Sistema de permissões e roles

### 📋 Contratos Inteligentes
- **Geração automática com IA**: Usando LangChain + OpenAI
- Contratos personalizados por tipo de imóvel
- Conformidade com Lei 8.245/91
- Análise jurídica automática
- Templates customizáveis

### 💰 Gestão Financeira
- Geração automática de boletos bancários
- Controle de pagamentos e inadimplência
- Cálculo automático de multas e juros
- Relatórios financeiros detalhados
- Integração com APIs bancárias

### 🤖 Inteligência Artificial
- **Detecção de Inadimplência**: Análise preditiva de risco
- **Geração de Contratos**: Criação automática e personalizada
- **Alertas Inteligentes**: Notificações proativas
- **Análise de Tendências**: Insights de mercado

### 📧 Sistema de Notificações
- Alertas por email automáticos
- Integração WhatsApp Business
- Lembretes de vencimento
- Notificações de risco
- Campanhas de cobrança

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização responsiva
- **Lucide React** - Ícones modernos

### Backend
- **Next.js API Routes** - API RESTful
- **NextAuth.js** - Autenticação
- **Prisma ORM** - Banco de dados
- **PostgreSQL** - Banco relacional

### Inteligência Artificial
- **LangChain** - Framework para IA
- **OpenAI GPT-4** - Modelo de linguagem
- **Análise Preditiva** - Algoritmos de ML

### Integração Externa
- **APIs de Boletos** - Geração automática
- **WhatsApp Business API** - Notificações
- **Email Services** - Envio de alertas

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Conta OpenAI (para IA)
- Contas de serviços (email, WhatsApp, boletos)

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/crm-imobiliario.git
cd crm-imobiliario
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/crm_imobiliario"

# Autenticação
NEXTAUTH_SECRET="seu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI para IA
OPENAI_API_KEY="sua-chave-openai"

# Serviços de Notificação
EMAIL_SERVICE_API_KEY="sua-chave-email"
WHATSAPP_API_KEY="sua-chave-whatsapp"

# API de Boletos
BOLETO_API_KEY="sua-chave-boletos"
```

### 4. Configure o banco de dados
```bash
# Aplicar schema
npm run db:push

# Popular com dados de exemplo
npm run db:seed
```

### 5. Execute o projeto
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 👤 Acesso ao Sistema

### Usuário Demo (será criado automaticamente)
- **Email**: admin@crm.com
- **Senha**: admin123

### Inicialização em Produção
Após deploy, acesse: `/api/init` (POST) para criar o usuário demo automaticamente.

## 🎯 Como Usar

### 1. Dashboard Principal
- Visão geral de métricas
- Atividades recentes
- Tarefas pendentes
- Ações rápidas

### 2. Cadastro de Imóveis
1. Acesse "Imóveis" → "Novo Imóvel"
2. Preencha dados básicos
3. Faça upload de fotos
4. Configure amenidades
5. Associe ao proprietário

### 3. Gestão de Contratos
1. Selecione imóvel e inquilino
2. Use o gerador automático com IA
3. Revise e ajuste termos
4. Finalize e armazene

### 4. Controle de Pagamentos
1. Pagamentos são gerados automaticamente
2. Boletos criados via API
3. Status atualizado em tempo real
4. Alertas automáticos de vencimento

### 5. Análise de Inadimplência
- IA analisa histórico de pagamentos
- Classifica risco (Baixo/Médio/Alto/Crítico)
- Sugere ações preventivas
- Gera relatórios de tendências

---

**Desenvolvido com ❤️ para revolucionar a gestão imobiliária**

*Deploy updated for Supabase PostgreSQL*
# Force redeploy Tue Jun 17 22:28:26 -03 2025
# Trigger deploy Tue Jun 17 22:42:47 -03 2025
# Deploy for lokafyimob project Tue Jun 17 22:48:04 -03 2025
# Test connection after restart Tue Jun 17 23:05:26 -03 2025
# Test with new password Tue Jun 17 23:11:08 -03 2025
# Test Railway PostgreSQL Tue Jun 17 23:23:02 -03 2025
# Test Railway external URL Tue Jun 17 23:26:56 -03 2025
# Test Railway proxy connection Tue Jun 17 23:46:35 -03 2025
# Test Neon connection Wed Jun 18 00:49:19 -03 2025
# Force Prisma regeneration Wed Jun 18 01:11:16 -03 2025

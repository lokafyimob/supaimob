# 🚀 Guia de Deploy - CRM Imobiliário

Este guia contém instruções para fazer deploy do CRM Imobiliário em diferentes plataformas.

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de ter:

- [ ] Conta na plataforma escolhida
- [ ] Banco PostgreSQL configurado
- [ ] Variáveis de ambiente definidas
- [ ] Chaves de API (OpenAI, email, WhatsApp, boletos)

## 🔧 Configuração das Variáveis de Ambiente

### Variáveis Obrigatórias
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="sua-chave-secreta-muito-longa"
NEXTAUTH_URL="https://seu-dominio.com"
OPENAI_API_KEY="sk-sua-chave-openai"
```

### Variáveis Opcionais
```env
EMAIL_SERVICE_API_KEY="sua-chave-email"
WHATSAPP_API_KEY="sua-chave-whatsapp"
BOLETO_API_KEY="sua-chave-boletos"
REDIS_URL="redis://localhost:6379"
```

## 🌐 Deploy para Vercel (Recomendado)

### 1. Via Script Automatizado
```bash
./scripts/deploy.sh vercel
```

### 2. Manual
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod
```

### 3. Configurações Específicas
- Configure as variáveis no painel da Vercel
- Conecte com banco PostgreSQL (Neon, Supabase, etc.)
- Configure domínio personalizado

**Vantagens:**
- ✅ Deploy automático via Git
- ✅ CDN global
- ✅ Escalabilidade automática
- ✅ SSL gratuito

## 🐳 Deploy com Docker

### 1. Via Script Automatizado
```bash
./scripts/deploy.sh docker
```

### 2. Manual
```bash
# Build da imagem
docker build -t crm-imobiliario .

# Subir com compose
docker-compose -f deploy/docker-production.yml up -d
```

### 3. Com Docker Swarm (Produção)
```bash
# Inicializar swarm
docker swarm init

# Deploy
docker stack deploy -c deploy/docker-production.yml crm-stack
```

**Vantagens:**
- ✅ Controle total do ambiente
- ✅ Inclui PostgreSQL e Redis
- ✅ Proxy reverso com Nginx
- ✅ Escalabilidade horizontal

## 🚄 Deploy para Railway

### 1. Via Script Automatizado
```bash
./scripts/deploy.sh railway
```

### 2. Manual
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
railway deploy
```

**Vantagens:**
- ✅ Setup simples
- ✅ Banco PostgreSQL incluído
- ✅ Deploy automático via Git
- ✅ Preço acessível

## ☁️ Deploy para AWS ECS

### 1. Via Script Automatizado
```bash
./scripts/deploy.sh aws
```

### 2. Manual

#### Pré-requisitos
- AWS CLI configurado
- ECR repository criado
- ECS cluster configurado

#### Passos
```bash
# Build e push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin account.dkr.ecr.us-east-1.amazonaws.com

docker build -t crm-imobiliario .
docker tag crm-imobiliario:latest account.dkr.ecr.us-east-1.amazonaws.com/crm-imobiliario:latest
docker push account.dkr.ecr.us-east-1.amazonaws.com/crm-imobiliario:latest

# Deploy no ECS
aws ecs update-service --cluster crm-cluster --service crm-service --force-new-deployment
```

**Vantagens:**
- ✅ Máxima escalabilidade
- ✅ Integração com outros serviços AWS
- ✅ Alta disponibilidade
- ✅ Controle granular

## 🛡️ Deploy Seguro

### Headers de Segurança
O projeto inclui headers de segurança configurados:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### SSL/TLS
- Vercel: SSL automático
- Docker: Configure certificados no Nginx
- Railway: SSL automático
- AWS: Use Application Load Balancer

## 📊 Monitoramento

### Health Check
O projeto inclui endpoint de health check:
```
GET /api/health
```

### Logs
```bash
# Docker
docker-compose logs -f app

# Vercel
vercel logs

# Railway
railway logs

# AWS
aws logs tail /ecs/crm-imobiliario --follow
```

## 🗄️ Banco de Dados

### Migrações
```bash
# Em produção
npm run db:migrate

# Popular dados iniciais
npm run db:seed
```

### Backup (Docker)
```bash
# Backup
docker exec crm-postgres-prod pg_dump -U crm_user crm_imobiliario > backup.sql

# Restore
docker exec -i crm-postgres-prod psql -U crm_user crm_imobiliario < backup.sql
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar DATABASE_URL
   - Verificar se o banco está acessível
   - Executar `npm run db:push`

2. **Erro de autenticação**
   - Verificar NEXTAUTH_SECRET
   - Verificar NEXTAUTH_URL
   - Limpar cookies do navegador

3. **Erro de build**
   - Executar `npm run type-check`
   - Verificar imports e dependências
   - Limpar cache: `rm -rf .next`

4. **Problemas de performance**
   - Ativar Redis para cache
   - Otimizar queries do banco
   - Configurar CDN

### Logs e Debug
```bash
# Verificar saúde da aplicação
curl https://seu-dominio.com/api/health

# Verificar variáveis
node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB Missing')"
```

## 📈 Otimizações de Produção

### 1. Cache
- Redis configurado para sessões
- Headers de cache para static assets
- Next.js ISR para páginas dinâmicas

### 2. Performance
- Compressão Gzip/Brotli
- Lazy loading de componentes
- Otimização de imagens

### 3. Segurança
- Rate limiting
- CSRF protection
- Input sanitization
- SQL injection protection

## 🔄 CI/CD

### GitHub Actions (Exemplo)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: ./scripts/deploy.sh vercel
```

---

## 📞 Suporte

Para problemas de deploy:
1. Verificar logs da aplicação
2. Consultar documentação da plataforma
3. Abrir issue no repositório

**Deploy bem-sucedido! 🎉**
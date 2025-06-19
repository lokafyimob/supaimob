# 🚀 Deploy no Vercel - Passos Detalhados

## ⚡ Deploy Rápido (Recomendado)

### Opção 1: Via Interface Web (Mais Fácil)
1. **Acesse**: https://vercel.com/
2. **Login** com GitHub/GitLab/Bitbucket
3. **Import Project** 
4. **Conecte o repositório** do GitHub
5. **Configure variáveis** (ver seção abaixo)
6. **Deploy!** ✨

### Opção 2: Via CLI
```bash
# 1. Login no Vercel
npx vercel login

# 2. Deploy
npx vercel deploy --prod

# Ou usar o script automatizado
./scripts/deploy.sh vercel
```

## 🔧 Variáveis de Ambiente Necessárias

### Obrigatórias:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=sua-chave-secreta-muito-longa-aqui
NEXTAUTH_URL=https://seu-projeto.vercel.app
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

### Opcionais (para APIs externas):
```env
OLX_CLIENT_ID=seu-client-id-olx
OLX_CLIENT_SECRET=seu-client-secret-olx
OLX_API_URL=https://apps.olx.com.br/autoupload
```

## 🗄️ Banco de Dados

### Opções Recomendadas (Gratuitas):
1. **Neon** (PostgreSQL): https://neon.tech/
2. **Supabase** (PostgreSQL): https://supabase.com/
3. **PlanetScale** (MySQL): https://planetscale.com/

### Configuração do Neon (Recomendado):
1. **Crie conta**: https://neon.tech/
2. **Crie projeto** novo
3. **Copie connection string**
4. **Cole no DATABASE_URL** da Vercel

## 📁 Estrutura de Deploy

O projeto está configurado para:
- ✅ **Next.js 15** (App Router)
- ✅ **Prisma ORM** (auto-configurado)
- ✅ **Build otimizado** 
- ✅ **TypeScript** verificado
- ✅ **Edge Runtime** compatível

## 🔄 Configuração Automática

### next.config.ts já configurado com:
```typescript
experimental: {
  serverComponentsExternalPackages: ['@prisma/client']
}
```

### package.json com scripts prontos:
```json
{
  "build": "prisma generate && prisma db push && next build",
  "start": "next start -p $PORT"
}
```

## 🚨 Checklist Pré-Deploy

### ✅ Antes de fazer deploy:
- [ ] Código sem erros TypeScript
- [ ] Database URL configurada
- [ ] NEXTAUTH_SECRET gerada
- [ ] OPENAI_API_KEY válida
- [ ] Domínio escolhido

### 🔧 Após deploy:
- [ ] Testar login
- [ ] Verificar banco de dados
- [ ] Testar busca de anúncios IA
- [ ] Configurar domínio personalizado

## 🌐 URLs Após Deploy

### Desenvolvimento:
- **Local**: http://localhost:3000
- **Vercel Preview**: https://projeto-xyz123.vercel.app

### Produção:
- **Vercel**: https://seu-projeto.vercel.app
- **Domínio Custom**: https://seudominio.com

## 💡 Dicas Importantes

### 1. Variáveis de Ambiente:
- Sempre configure na interface da Vercel
- Use NEXTAUTH_URL com domínio da Vercel
- Mantenha NEXTAUTH_SECRET seguro

### 2. Banco de Dados:
- Use PostgreSQL (melhor compatibilidade)
- Configure SSL/TLS
- Teste conexão antes do deploy

### 3. Performance:
- Vercel CDN global automático
- Edge Runtime configurado
- Build otimizado habilitado

## 🔗 Links Úteis

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deploy**: https://nextjs.org/docs/deployment
- **Prisma Deploy**: https://www.prisma.io/docs/guides/deployment

## 🎯 Resultado Final

Após o deploy bem-sucedido:
```
✅ CRM Imobiliário Online
🌐 https://seu-projeto.vercel.app
🔐 Login funcionando
🤖 IA de anúncios ativa
📱 Responsivo em todos dispositivos
⚡ Performance otimizada
```

---

## 🆘 Problemas Comuns

### Build Error:
```bash
# Limpar cache e reconstruir
rm -rf .next
npm ci
npm run build
```

### Database Error:
```bash
# Verificar conexão
npx prisma db push
npx prisma generate
```

### Auth Error:
- Verificar NEXTAUTH_URL
- Verificar NEXTAUTH_SECRET
- Limpar cookies do navegador

**Deploy pronto para produção! 🚀**
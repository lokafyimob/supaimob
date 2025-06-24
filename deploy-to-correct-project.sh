#!/bin/bash

echo "🚀 Deploy para o projeto correto na Vercel"
echo "========================================="

# Link para o projeto correto com todas as variáveis
echo "1. Linking to correct project..."
npx vercel link --yes --project=app --scope=gprop

# Deploy para produção
echo "2. Deploying to production..."
npx vercel deploy --prod --yes

echo "✅ Deploy concluído!"
echo "🌐 Verifique: https://app.gprop.com.br"
#!/bin/bash

# Script de Deploy Automatizado - CRM Imobiliário
# Uso: ./scripts/deploy.sh [vercel|docker|railway|aws]

set -e

PLATFORM=${1:-"docker"}
PROJECT_NAME="crm-imobiliario"

echo "🚀 Iniciando deploy para plataforma: $PLATFORM"

# Verificar se todas as variáveis necessárias estão definidas
check_env_vars() {
    local required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "OPENAI_API_KEY")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ Erro: Variável de ambiente $var não está definida"
            echo "💡 Configure as variáveis no arquivo .env ou no ambiente"
            exit 1
        fi
    done
    
    echo "✅ Variáveis de ambiente verificadas"
}

# Pre-deploy: verificações e preparação
pre_deploy() {
    echo "🔍 Executando verificações pré-deploy..."
    
    # Verificar se o projeto compila
    npm run type-check
    echo "✅ Verificação de tipos concluída"
    
    # Executar testes se existirem
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        echo "✅ Testes executados"
    fi
    
    # Gerar cliente Prisma
    npx prisma generate
    echo "✅ Cliente Prisma gerado"
}

# Deploy para Vercel
deploy_vercel() {
    echo "🌐 Fazendo deploy para Vercel..."
    
    # Instalar Vercel CLI se não existir
    if ! command -v vercel &> /dev/null; then
        npm install -g vercel
    fi
    
    # Deploy para produção
    vercel deploy --prod --yes
    
    echo "✅ Deploy para Vercel concluído!"
    echo "🔗 Acesse: https://crm-imobiliario.vercel.app"
}

# Deploy com Docker
deploy_docker() {
    echo "🐳 Fazendo deploy com Docker..."
    
    # Build da imagem
    docker build -t $PROJECT_NAME .
    echo "✅ Imagem Docker criada"
    
    # Subir com Docker Compose
    docker-compose -f deploy/docker-production.yml up -d
    echo "✅ Containers iniciados"
    
    # Aguardar aplicação ficar disponível
    echo "⏳ Aguardando aplicação ficar disponível..."
    timeout 60 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done'
    
    echo "✅ Deploy Docker concluído!"
    echo "🔗 Acesse: http://localhost:3000"
}

# Deploy para Railway
deploy_railway() {
    echo "🚄 Fazendo deploy para Railway..."
    
    # Instalar Railway CLI se não existir
    if ! command -v railway &> /dev/null; then
        npm install -g @railway/cli
    fi
    
    # Login e deploy
    railway login
    railway deploy
    
    echo "✅ Deploy para Railway concluído!"
}

# Deploy para AWS ECS
deploy_aws() {
    echo "☁️ Fazendo deploy para AWS ECS..."
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI não encontrado. Instale primeiro: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    # Build e push para ECR
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=${AWS_DEFAULT_REGION:-us-east-1}
    ECR_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME"
    
    # Login no ECR
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO
    
    # Build e tag
    docker build -t $PROJECT_NAME .
    docker tag $PROJECT_NAME:latest $ECR_REPO:latest
    
    # Push
    docker push $ECR_REPO:latest
    
    # Atualizar ECS service
    aws ecs update-service --cluster crm-cluster --service crm-service --force-new-deployment
    
    echo "✅ Deploy para AWS ECS concluído!"
}

# Executar deploy baseado na plataforma
case $PLATFORM in
    "vercel")
        check_env_vars
        pre_deploy
        deploy_vercel
        ;;
    "docker")
        check_env_vars
        pre_deploy
        deploy_docker
        ;;
    "railway")
        check_env_vars
        pre_deploy
        deploy_railway
        ;;
    "aws")
        check_env_vars
        pre_deploy
        deploy_aws
        ;;
    *)
        echo "❌ Plataforma não suportada: $PLATFORM"
        echo "💡 Plataformas disponíveis: vercel, docker, railway, aws"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "📋 Próximos passos:"
echo "   1. Configurar domínio personalizado"
echo "   2. Configurar monitoramento"
echo "   3. Configurar backup do banco de dados"
echo "   4. Executar seed do banco: npm run db:seed"
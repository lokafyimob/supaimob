# 🤖 Sistema de Busca Inteligente de Anúncios

## Visão Geral

O sistema de busca inteligente de anúncios utiliza IA para encontrar automaticamente imóveis na internet que combinam com o perfil dos seus leads. Esta funcionalidade revoluciona a experiência do seu CRM, potencializando significativamente as chances de fechar negócios.

## ✨ Funcionalidades

### 🔍 Busca Automatizada
- **Múltiplas fontes**: Busca em VivaReal, ZAP Imóveis, OLX e ImovelWeb
- **Filtros inteligentes**: Aplica automaticamente os critérios do lead (localização, preço, tipo de imóvel, etc.)
- **Busca em tempo real**: Resultados atualizados a cada pesquisa

### 🧠 Inteligência Artificial
- **Filtragem inteligente**: IA analisa e pontua a relevância de cada anúncio
- **Remoção de duplicatas**: Elimina anúncios repetidos automaticamente
- **Ranking por relevância**: Ordena resultados por compatibilidade com o lead

### 🎯 Interface Intuitiva
- **Modal interativo**: Interface limpa e fácil de usar
- **Score de relevância**: Visualização com estrelas (1-5) da compatibilidade
- **Informações completas**: Preço, localização, características e descrição
- **Links diretos**: Acesso rápido aos anúncios originais

## 🚀 Como Usar

### 1. Na Lista de Leads
- Clique no botão **"IA"** (roxo/rosa) ao lado de qualquer lead ativo
- Aguarde o processamento da busca inteligente
- Visualize os resultados no modal que se abrirá

### 2. Informações Exibidas
- **Critérios de busca**: Resumo dos filtros aplicados
- **Lista de anúncios**: Cards com todas as informações relevantes
- **Score de relevância**: Pontuação de 0-100% de compatibilidade
- **Fonte do anúncio**: Identificação visual da plataforma

### 3. Ações Disponíveis
- **Ver Anúncio**: Link direto para o anúncio original
- **Análise da IA**: Score visual de relevância
- **Detalhes completos**: Fotos, preço, localização, características

## ⚙️ Configuração

### Variáveis de Ambiente Necessárias
```bash
# OpenAI API Key (obrigatória para IA)
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### Como Configurar
1. Acesse [OpenAI](https://platform.openai.com/)
2. Crie uma conta e obtenha sua API key
3. Adicione a chave no arquivo `.env` do projeto
4. Reinicie o servidor

## 🔧 Arquitetura Técnica

### Componentes Criados
- `src/lib/ai-listing-finder.ts` - Serviço principal de busca
- `src/app/api/leads/[id]/listings/route.ts` - API endpoint
- `src/components/ai-listings-modal.tsx` - Interface do usuário

### Fluxo de Funcionamento
1. **Análise do Lead**: Extrai critérios de busca do perfil
2. **Busca Multi-plataforma**: Consulta múltiplas fontes simultaneamente
3. **Processamento IA**: Filtra e pontua resultados com OpenAI
4. **Apresentação**: Exibe resultados ordenados por relevância

## 📊 Benefícios

### Para Corretores
- ⚡ **Agilidade**: Encontra anúncios em segundos
- 🎯 **Precisão**: IA filtra apenas opções relevantes
- 📈 **Produtividade**: Mais tempo para vendas, menos para busca
- 🤝 **Satisfação do Cliente**: Apresenta opções qualificadas

### Para Leads
- 🏠 **Variedade**: Acesso a múltiplas plataformas
- ✨ **Qualidade**: Apenas anúncios compatíveis com o perfil
- ⏱️ **Rapidez**: Resultados instantâneos
- 🔗 **Conveniência**: Links diretos para mais detalhes

## 💡 Exemplo de Uso

**Cenário**: Lead procura apartamento em Águas Claras-DF para aluguel até R$ 2.500

**Resultado**: 
- 🔍 Sistema busca automaticamente em todas as plataformas
- 🤖 IA analisa descrições e características
- ⭐ Pontua cada anúncio de 0-100% de relevância
- 📱 Apresenta resultados ordenados com fotos e links

## 🛠️ Manutenção

### Logs e Monitoramento
- Logs detalhados no console para debugging
- Contadores de anúncios encontrados
- Tratamento de erros robusto

### Limitações Atuais
- Funciona com dados mockados (demo)
- Requer API key do OpenAI
- Limitado a anúncios em português

## 🔮 Próximos Passos

### Melhorias Futuras
- [ ] Integração real com APIs dos sites
- [ ] Cache de resultados
- [ ] Notificações de novos anúncios
- [ ] Histórico de buscas
- [ ] Favoritos e comparações
- [ ] Web scraping avançado

### Expansões Possíveis
- [ ] Mais plataformas (Imovelweb, QuintoAndar, etc.)
- [ ] Busca internacional
- [ ] Alertas automáticos
- [ ] Integração com WhatsApp
- [ ] Análise de mercado

---

## 📞 Suporte

Para dúvidas ou sugestões sobre esta funcionalidade, entre em contato com a equipe de desenvolvimento.

**Desenvolvido com ❤️ para revolucionar o mercado imobiliário!**
-- Migração para adicionar campos de financiamento
-- Execute este script no banco PostgreSQL

-- Adicionar campo acceptsFinancing na tabela properties
ALTER TABLE properties 
ADD COLUMN "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false;

-- Adicionar campo needsFinancing na tabela leads  
ALTER TABLE leads 
ADD COLUMN "needsFinancing" BOOLEAN NOT NULL DEFAULT false;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('properties', 'leads') 
  AND column_name IN ('acceptsFinancing', 'needsFinancing')
ORDER BY table_name, column_name;
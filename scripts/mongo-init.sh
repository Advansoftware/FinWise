#!/bin/bash
# Script de inicialização do MongoDB no container
# Este script é executado automaticamente quando o container MongoDB é criado

set -e

echo "🚀 Inicializando MongoDB para desenvolvimento..."

# Aguardar o MongoDB estar pronto
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "⏳ Aguardando MongoDB iniciar..."
  sleep 2
done

echo "✅ MongoDB iniciado!"

# Verificar se existem dados para importar
if [ -d "/mongo-dump/gastometria" ]; then
  echo "📦 Dados de produção encontrados. Importando..."
  
  # Importar dados usando mongorestore
  mongorestore \
    --db=gastometria_dev \
    --drop \
    /mongo-dump/gastometria
  
  echo "✅ Dados de produção importados para gastometria_dev!"
else
  echo "⚠️  Nenhum dump de produção encontrado em /mongo-dump/gastometria"
  echo "💡 Execute 'make export-prod-data' para exportar dados de produção"
  echo "📝 Criando banco de dados vazio: gastometria_dev"
  
  # Criar banco de dados vazio
  mongosh gastometria_dev --eval "db.createCollection('_init')"
fi

echo "🎉 Inicialização do MongoDB concluída!"

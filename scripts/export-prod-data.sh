#!/bin/bash
# Script para exportar dados de produção do MongoDB

set -e

# Configurações do MongoDB de produção
PROD_HOST="192.168.3.13"
PROD_PORT="27018"
PROD_DB="gastometria"

# Diretório de saída
OUTPUT_DIR="./scripts/mongo-dump"

echo "🔄 Exportando dados de produção do MongoDB..."
echo "Host: $PROD_HOST:$PROD_PORT"
echo "Database: $PROD_DB"
echo "Output: $OUTPUT_DIR"

# Criar diretório se não existir
mkdir -p "$OUTPUT_DIR"

# Verificar se mongodump está instalado
if command -v mongodump &> /dev/null; then
    echo "✅ Usando mongodump local"
    mongodump \
      --host="$PROD_HOST" \
      --port="$PROD_PORT" \
      --db="$PROD_DB" \
      --out="$OUTPUT_DIR"
else
    echo "⚠️  mongodump não encontrado localmente"
    echo "🐳 Usando Docker para exportar dados..."
    
    # Usar container Docker com MongoDB tools
    docker run --rm \
      --user "$(id -u):$(id -g)" \
      -v "$(pwd)/$OUTPUT_DIR:/dump" \
      mongo:7.0 \
      mongodump \
        --host="$PROD_HOST" \
        --port="$PROD_PORT" \
        --db="$PROD_DB" \
        --out="/dump"
fi

echo "✅ Exportação concluída!"
echo "📁 Dados salvos em: $OUTPUT_DIR/$PROD_DB"

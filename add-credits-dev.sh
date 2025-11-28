#!/bin/bash

# add-credits-dev.sh - Script para adicionar créditos de IA (sem verificação de senha - apenas desenvolvimento)
# Uso: ./add-credits-dev.sh <email> <quantidade_creditos>

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar argumentos
if [ $# -ne 2 ]; then
    log_error "Uso: $0 <email> <quantidade_creditos>"
    log_info "Exemplo: $0 bruno@exemplo.com 100"
    log_warning "ATENÇÃO: Este script é apenas para desenvolvimento - não verifica senha!"
    exit 1
fi

EMAIL="$1"
CREDITS="$2"

# Validar quantidade de créditos
if ! [[ "$CREDITS" =~ ^[0-9]+$ ]]; then
    log_error "A quantidade de créditos deve ser um número inteiro positivo"
    exit 1
fi

if [ "$CREDITS" -le 0 ]; then
    log_error "A quantidade de créditos deve ser maior que zero"
    exit 1
fi

log_warning "=== FinWise - Adicionar Créditos (DESENVOLVIMENTO) ==="
log_warning "ATENÇÃO: Este script NÃO verifica senha - use apenas em desenvolvimento!"
log_info "Email: $EMAIL"
log_info "Créditos a adicionar: $CREDITS"
echo

# Verificar se o Docker Compose está rodando
log_info "Verificando se o MongoDB está rodando..."
if ! docker ps | grep -q "gastometria-mongo"; then
    log_warning "Container do MongoDB não está rodando. Tentando iniciar..."
    if ! docker-compose up -d mongo; then
        log_error "Falha ao iniciar o MongoDB. Certifique-se de que o docker-compose.yml está correto."
        exit 1
    fi
    log_info "Aguardando MongoDB inicializar..."
    sleep 5
fi

log_success "MongoDB está rodando!"

# Script MongoDB para encontrar e atualizar o usuário
MONGO_SCRIPT="
use('gastometria');

// Buscar usuário por email
var user = db.users.findOne({email: '$EMAIL'});

if (!user) {
    print('ERROR: Usuário com email $EMAIL não encontrado');
    quit(1);
}

// Mostrar dados atuais
print('=== DADOS ATUAIS DO USUÁRIO ===');
print('ID: ' + user._id);
print('Email: ' + user.email);
print('Nome: ' + user.displayName);
print('Plano: ' + user.plan);
print('Créditos atuais: ' + (user.aiCredits || 0));
print('');

// Calcular novos créditos
var currentCredits = user.aiCredits || 0;
var newCredits = currentCredits + $CREDITS;

// Atualizar créditos
var result = db.users.updateOne(
    {_id: user._id},
    {\$set: {aiCredits: newCredits}}
);

if (result.modifiedCount === 1) {
    print('SUCCESS: Créditos adicionados com sucesso!');
    print('Créditos anteriores: ' + currentCredits);
    print('Créditos adicionados: $CREDITS');
    print('Total de créditos: ' + newCredits);
    
    // Log da operação
    db.aiCreditLogs.insertOne({
        userId: user._id.toString(),
        action: 'Créditos Desenvolvimento (Script)',
        cost: -$CREDITS, // Negativo porque é adição
        timestamp: new ISODate(),
        note: 'Créditos adicionados via script de desenvolvimento (sem verificação de senha)'
    });
    
    print('Log registrado na coleção aiCreditLogs');
} else {
    print('ERROR: Falha ao atualizar créditos');
    quit(1);
}
"

# Executar script no MongoDB
log_info "Conectando ao MongoDB e atualizando créditos..."
echo

if docker exec gastometria-mongo mongosh --quiet --eval "$MONGO_SCRIPT"; then
    echo
    log_success "✅ Operação concluída com sucesso!"
    log_info "Os créditos foram adicionados à conta de $EMAIL"
    echo
    log_info "💡 Dica: Você pode verificar os créditos no dashboard da aplicação"
else
    echo
    log_error "❌ Falha na operação. Verifique os logs acima."
    exit 1
fi
# 🚀 Ambiente de Desenvolvimento - FinWise

Este guia explica como configurar e usar o ambiente de desenvolvimento Docker para o FinWise.

## 📋 Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)
- Make (geralmente já instalado no Linux)
- MongoDB Database Tools (para exportar dados de produção)
  ```bash
  # Ubuntu/Debian
  sudo apt-get install mongodb-database-tools
  
  # macOS
  brew install mongodb-database-tools
  ```

## 🎯 Características

- ✅ **Hot Reload**: Alterações no código são refletidas automaticamente
- ✅ **MongoDB Local**: Banco de dados isolado para desenvolvimento
- ✅ **Importação de Dados**: Importa dados de produção para testes
- ✅ **Makefile**: Comandos simples para gerenciar o ambiente
- ✅ **Isolamento**: Não interfere com o ambiente de produção

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

O arquivo `.env.dev` já foi criado com configurações padrão. Edite-o se necessário:

```bash
nano .env.dev
```

**Importante**: Adicione suas chaves de API (Stripe, Gemini, etc.) no arquivo `.env.dev`.

### 2. (Opcional) Exportar Dados de Produção

Se você quiser trabalhar com dados reais de produção:

```bash
make export-prod-data
```

Este comando irá:
- Conectar ao MongoDB de produção (192.168.3.13:27018)
- Exportar todos os dados do banco `gastometria`
- Salvar em `scripts/mongo-dump/`

### 3. Iniciar o Ambiente

```bash
make dev-up
```

Aguarde alguns segundos e acesse:
- **Aplicação**: http://localhost:9002
- **MongoDB**: mongodb://localhost:27017

## 📚 Comandos Disponíveis

### Gerenciamento do Ambiente

```bash
make help              # Mostra todos os comandos disponíveis
make dev-up            # Inicia o ambiente de desenvolvimento
make dev-down          # Para o ambiente
make dev-restart       # Reinicia o ambiente
make dev-rebuild       # Reconstrói e reinicia (use após mudanças no Dockerfile)
make dev-status        # Mostra status dos containers
```

### Logs e Monitoramento

```bash
make dev-logs          # Mostra logs de todos os containers
make dev-logs-app      # Mostra apenas logs da aplicação
make dev-logs-mongo    # Mostra apenas logs do MongoDB
```

### Gerenciamento de Dados

```bash
make export-prod-data  # Exporta dados de produção
make dev-import-data   # Importa dados no ambiente de dev
make dev-mongo-shell   # Abre shell do MongoDB
```

### Acesso aos Containers

```bash
make dev-shell-app     # Abre shell no container da aplicação
make dev-shell-mongo   # Abre shell no container do MongoDB
```

### Limpeza

```bash
make dev-clean         # Remove containers, volumes e imagens
make dev-clean-cache   # Remove cache do Next.js
```

### Utilitários

```bash
# Instalar pacote npm
make dev-npm CMD="install axios"

# Executar comando no container
make dev-exec CMD="ls -la"
```

## 🔧 Estrutura de Arquivos

```
FinWise/
├── Dockerfile.dev              # Dockerfile para desenvolvimento
├── docker-compose.dev.yml      # Configuração do Docker Compose
├── .env.dev                    # Variáveis de ambiente de desenvolvimento
├── Makefile                    # Comandos make para gerenciar o ambiente
└── scripts/
    ├── export-prod-data.sh     # Script para exportar dados de produção
    ├── mongo-init.sh           # Script de inicialização do MongoDB
    └── mongo-dump/             # Dados exportados de produção (criado automaticamente)
        └── gastometria/        # Dump do banco de produção
```

## 🔄 Workflow de Desenvolvimento

### Desenvolvimento Normal

1. Inicie o ambiente:
   ```bash
   make dev-up
   ```

2. Edite os arquivos em `src/`, `public/`, etc.

3. As alterações serão refletidas automaticamente (hot reload)

4. Veja os logs em tempo real:
   ```bash
   make dev-logs-app
   ```

### Trabalhando com Dados de Produção

1. Exporte os dados:
   ```bash
   make export-prod-data
   ```

2. Importe no ambiente de dev:
   ```bash
   make dev-import-data
   ```

3. Os dados estarão disponíveis no banco `gastometria_dev`

### Após Mudanças no Dockerfile ou Dependências

Se você modificar o `Dockerfile.dev` ou `package.json`:

```bash
make dev-rebuild
```

## 🐛 Troubleshooting

### Porta 9002 já está em uso

```bash
# Pare o processo que está usando a porta
sudo lsof -ti:9002 | xargs kill -9

# Ou mude a porta no docker-compose.dev.yml
```

### MongoDB não inicia

```bash
# Verifique os logs
make dev-logs-mongo

# Remova o volume e recrie
make dev-clean
make dev-up
```

### Hot Reload não funciona

```bash
# Reinicie o container da aplicação
make dev-restart-app

# Ou limpe o cache
make dev-clean-cache
make dev-restart-app
```

### Erro ao exportar dados de produção

Certifique-se de que:
1. O MongoDB de produção está acessível (192.168.3.13:27018)
2. Você tem `mongodb-database-tools` instalado
3. Você tem permissões de rede para acessar o servidor

## 📝 Notas Importantes

### Diferenças entre Dev e Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Banco de Dados | `gastometria_dev` | `gastometria` |
| URL | http://localhost:9002 | https://gastometria.com.br |
| Hot Reload | ✅ Ativado | ❌ Desativado |
| Build | Não necessário | Build otimizado |
| Volumes | Código montado | Código copiado |

### Segurança

- ⚠️ **Nunca** use `.env.dev` em produção
- ⚠️ Use chaves de **teste** do Stripe no `.env.dev`
- ⚠️ Os dados exportados de produção contêm informações sensíveis
- ⚠️ Adicione `scripts/mongo-dump/` ao `.gitignore`

### Performance

- O hot reload pode ser lento em grandes projetos
- Use `make dev-clean-cache` se o Next.js estiver lento
- O MongoDB usa um volume Docker para persistência

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `make dev-logs`
2. Verifique o status: `make dev-status`
3. Tente reconstruir: `make dev-rebuild`
4. Como último recurso: `make dev-clean` e `make dev-up`

## 🎉 Pronto!

Agora você tem um ambiente de desenvolvimento completo e isolado. Bom desenvolvimento! 🚀

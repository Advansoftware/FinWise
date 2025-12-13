.PHONY: help dev-up dev-down dev-restart dev-rebuild dev-logs dev-logs-app dev-logs-mongo export-prod-data dev-clean dev-shell-app dev-shell-mongo dev-status

# Cores para output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Configurações
COMPOSE_FILE := docker-compose.dev.yml
PROJECT_NAME := finwise-dev

##@ Ajuda

help: ## Mostra esta mensagem de ajuda
	@echo "$(BLUE)FinWise - Comandos de Desenvolvimento$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Ambiente de Desenvolvimento

dev-up: ## Inicia o ambiente de desenvolvimento
	@echo "$(GREEN)🚀 Iniciando ambiente de desenvolvimento...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up -d
	@echo "$(GREEN)✅ Ambiente iniciado!$(NC)"
	@echo "$(YELLOW)📱 Aplicação: http://localhost:9002$(NC)"
	@echo "$(YELLOW)🗄️  MongoDB: mongodb://localhost:27017$(NC)"
	@echo ""
	@echo "$(BLUE)💡 Dica: Use 'make dev-logs' para ver os logs$(NC)"

dev-down: ## Para o ambiente de desenvolvimento
	@echo "$(YELLOW)🛑 Parando ambiente de desenvolvimento...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down
	@echo "$(GREEN)✅ Ambiente parado!$(NC)"

dev-restart: ## Reinicia o ambiente de desenvolvimento
	@echo "$(YELLOW)🔄 Reiniciando ambiente de desenvolvimento...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) restart
	@echo "$(GREEN)✅ Ambiente reiniciado!$(NC)"

dev-rebuild: ## Reconstrói e reinicia o ambiente de desenvolvimento
	@echo "$(YELLOW)🔨 Reconstruindo ambiente de desenvolvimento...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) build --no-cache
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up -d
	@echo "$(GREEN)✅ Ambiente reconstruído e iniciado!$(NC)"

dev-restart-app: ## Reinicia apenas o container da aplicação
	@echo "$(YELLOW)🔄 Reiniciando aplicação...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) restart app
	@echo "$(GREEN)✅ Aplicação reiniciada!$(NC)"

dev-restart-mongo: ## Reinicia apenas o container do MongoDB
	@echo "$(YELLOW)🔄 Reiniciando MongoDB...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) restart mongo
	@echo "$(GREEN)✅ MongoDB reiniciado!$(NC)"

##@ Logs e Monitoramento

dev-logs: ## Mostra logs de todos os containers
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f

dev-logs-app: ## Mostra logs apenas da aplicação
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f app

dev-logs-mongo: ## Mostra logs apenas do MongoDB
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f mongo

dev-status: ## Mostra status dos containers
	@echo "$(BLUE)📊 Status dos containers:$(NC)"
	@docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) ps

##@ Dados e Banco de Dados

export-prod-data: ## Exporta dados de produção do MongoDB
	@echo "$(YELLOW)📦 Exportando dados de produção...$(NC)"
	@chmod +x scripts/export-prod-data.sh
	@./scripts/export-prod-data.sh
	@echo "$(GREEN)✅ Dados exportados!$(NC)"
	@echo "$(BLUE)💡 Execute 'make dev-rebuild' para importar os dados no ambiente de dev$(NC)"

dev-import-data: ## Importa dados de produção no ambiente de dev (requer rebuild)
	@echo "$(YELLOW)📥 Importando dados de produção...$(NC)"
	@if [ ! -d "scripts/mongo-dump/gastometria" ]; then \
		echo "$(RED)❌ Erro: Dados de produção não encontrados!$(NC)"; \
		echo "$(BLUE)💡 Execute 'make export-prod-data' primeiro$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)🔨 Reconstruindo MongoDB com dados de produção...$(NC)"
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) stop mongo
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) rm -f mongo
	docker volume rm -f $(PROJECT_NAME)_mongo-dev-data || true
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up -d mongo
	@echo "$(GREEN)✅ Dados importados!$(NC)"

dev-mongo-shell: ## Abre shell do MongoDB
	@echo "$(BLUE)🗄️  Abrindo MongoDB shell...$(NC)"
	docker exec -it finwise-dev-mongo mongosh gastometria_dev

##@ Shell e Acesso aos Containers

dev-shell-app: ## Abre shell no container da aplicação
	@echo "$(BLUE)🐚 Abrindo shell no container da aplicação...$(NC)"
	docker exec -it finwise-dev-app sh

dev-shell-mongo: ## Abre shell no container do MongoDB
	@echo "$(BLUE)🐚 Abrindo shell no container do MongoDB...$(NC)"
	docker exec -it finwise-dev-mongo sh

##@ Limpeza

dev-clean: ## Remove containers, volumes e imagens do ambiente de dev
	@echo "$(RED)🧹 Limpando ambiente de desenvolvimento...$(NC)"
	@echo "$(YELLOW)⚠️  Isso irá remover todos os dados do MongoDB de desenvolvimento!$(NC)"
	@read -p "Tem certeza? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down -v; \
		docker rmi $(PROJECT_NAME)-app 2>/dev/null || true; \
		echo "$(GREEN)✅ Ambiente limpo!$(NC)"; \
	else \
		echo "$(YELLOW)❌ Operação cancelada$(NC)"; \
	fi

dev-clean-cache: ## Remove cache do Next.js e node_modules
	@echo "$(YELLOW)🧹 Limpando cache...$(NC)"
	rm -rf .next
	rm -rf node_modules/.cache
	@echo "$(GREEN)✅ Cache limpo!$(NC)"

##@ Utilitários

dev-npm: ## Executa comando npm no container (ex: make dev-npm CMD="install axios")
	@if [ -z "$(CMD)" ]; then \
		echo "$(RED)❌ Erro: Especifique o comando com CMD=\"...\"$(NC)"; \
		echo "$(BLUE)Exemplo: make dev-npm CMD=\"install axios\"$(NC)"; \
		exit 1; \
	fi
	docker exec -it finwise-dev-app npm $(CMD)

dev-exec: ## Executa comando no container da aplicação (ex: make dev-exec CMD="ls -la")
	@if [ -z "$(CMD)" ]; then \
		echo "$(RED)❌ Erro: Especifique o comando com CMD=\"...\"$(NC)"; \
		echo "$(BLUE)Exemplo: make dev-exec CMD=\"ls -la\"$(NC)"; \
		exit 1; \
	fi
	docker exec -it finwise-dev-app $(CMD)

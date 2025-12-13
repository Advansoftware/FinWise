# 🚀 FinWise Dev - Comandos Rápidos

## Comandos Principais

```bash
# Iniciar ambiente
make dev-up

# Parar ambiente
make dev-down

# Ver logs
make dev-logs

# Reconstruir tudo
make dev-rebuild
```

## Primeiro Uso

```bash
# 1. (Opcional) Exportar dados de produção
make export-prod-data

# 2. Iniciar ambiente
make dev-up

# 3. Acessar aplicação
# http://localhost:9002
```

## Comandos Úteis

```bash
make help                    # Lista todos os comandos
make dev-status             # Status dos containers
make dev-logs-app           # Logs da aplicação
make dev-logs-mongo         # Logs do MongoDB
make dev-restart-app        # Reinicia apenas a app
make dev-mongo-shell        # Shell do MongoDB
make dev-shell-app          # Shell do container
make dev-clean              # Limpa tudo
make dev-import-data        # Importa dados de prod
```

## Instalando Pacotes

```bash
make dev-npm CMD="install axios"
make dev-npm CMD="uninstall axios"
```

## Troubleshooting

```bash
# App não atualiza?
make dev-restart-app

# Erro estranho?
make dev-rebuild

# Tudo quebrado?
make dev-clean
make dev-up
```

## URLs

- **App**: http://localhost:9002
- **MongoDB**: mongodb://localhost:27017
- **DB Name**: gastometria_dev

---

📖 **Documentação completa**: [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md)

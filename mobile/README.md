# Gastometria Mobile

Aplicativo mobile Flutter para o Gastometria - Sistema de gestão financeira pessoal.

## 📱 Sobre

Este é o aplicativo mobile oficial do Gastometria, desenvolvido em Flutter para consumir a API REST do projeto principal.

> **Nota:** A API Mobile está disponível exclusivamente para usuários do plano **Infinity**.

## 🚀 Começando

### Pré-requisitos

- Flutter SDK (^3.10.0)
- Dart SDK (^3.0.0)
- Android Studio / Xcode (para emuladores)
- Servidor do Gastometria rodando (para desenvolvimento)

### Instalação

```bash
# Entre na pasta do projeto mobile
cd mobile

# Instale as dependências
flutter pub get

# Execute em modo desenvolvimento
flutter run
```

### Configuração da API

Por padrão, o app está configurado para se conectar ao servidor local. Para alterar, edite o arquivo:

```dart
// lib/core/constants/api_constants.dart
static const String devBaseUrl = 'http://10.0.2.2:9002/api/v1';  // Android Emulator
static const String prodBaseUrl = 'https://gastometria.vercel.app/api/v1';
```

> **Android Emulator:** Use `10.0.2.2` em vez de `localhost`
> **iOS Simulator:** Use `localhost` normalmente

## 📁 Estrutura do Projeto

```
lib/
├── core/
│   ├── constants/       # Constantes da API e do app
│   ├── models/          # Modelos de dados (User, Transaction, etc)
│   ├── providers/       # Providers de estado (ChangeNotifier)
│   ├── services/        # Serviços de API
│   ├── theme/           # Tema e cores do app
│   └── utils/           # Utilitários (formatação, validação)
├── screens/
│   ├── auth/            # Telas de autenticação
│   └── home/            # Tela principal e tabs
└── main.dart            # Entry point do app
```

## 🔌 API Endpoints

O app consome os seguintes endpoints da API v1:

| Endpoint             | Descrição         |
| -------------------- | ----------------- |
| `POST /login`        | Autenticação      |
| `POST /refresh`      | Renovar token     |
| `GET /me`            | Dados do usuário  |
| `GET /transactions`  | Listar transações |
| `POST /transactions` | Criar transação   |
| `GET /wallets`       | Listar carteiras  |
| `GET /budgets`       | Listar orçamentos |
| `GET /goals`         | Listar metas      |

## 🎨 Recursos

- ✅ Autenticação JWT com refresh automático
- ✅ Tema claro/escuro
- ✅ Dashboard com resumo financeiro
- ✅ Lista de transações com pull-to-refresh
- ✅ Lista de carteiras
- ✅ Perfil do usuário
- 🚧 Criação de transações (em desenvolvimento)
- 🚧 Gráficos e relatórios (em desenvolvimento)
- 🚧 Orçamentos e metas (em desenvolvimento)

## 🛠️ Tecnologias

- **Flutter** - Framework de UI
- **Provider** - Gerenciamento de estado
- **HTTP** - Requisições à API
- **Shared Preferences** - Armazenamento local
- **Intl** - Formatação de moeda e datas

## 📄 Licença

Este projeto faz parte do Gastometria e segue a mesma licença do projeto principal.

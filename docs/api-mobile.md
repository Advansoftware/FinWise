---
title: API Mobile
order: 10
---

# API Mobile do Gastometria

A API Mobile do Gastometria permite integrar seu aplicativo Flutter (ou qualquer cliente HTTP) com a plataforma.

> **Requisito:** Esta API está disponível **exclusivamente** para usuários do plano **Infinity**.

## Base URL

```
Desenvolvimento: http://localhost:9002/api/mobile
Produção: https://seu-dominio.vercel.app/api/mobile
```

## Autenticação

A API utiliza autenticação JWT (Bearer Token).

### Fluxo de Autenticação

1. Faça login com `/api/mobile/login` para obter tokens
2. Use o `accessToken` no header `Authorization: Bearer {token}`
3. Quando expirar, use `/api/mobile/refresh` com o `refreshToken`

---

## Endpoints

### POST /api/mobile/login

Autentica o usuário e retorna tokens JWT.

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "abc123",
    "email": "usuario@email.com",
    "displayName": "João Silva",
    "plan": "Infinity",
    "aiCredits": 500
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

**Erros:**
- `400` - Email ou senha não fornecidos
- `401` - Credenciais inválidas
- `403` - Plano não é Infinity (API Mobile requer Infinity)

---

### POST /api/mobile/refresh

Renova o access token usando o refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

**Erros:**
- `400` - Refresh token não fornecido
- `401` - Refresh token inválido ou expirado
- `403` - Plano não é mais Infinity

---

### GET /api/mobile/me

Retorna os dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "user": {
    "id": "abc123",
    "email": "usuario@email.com",
    "displayName": "João Silva",
    "plan": "Infinity",
    "aiCredits": 500
  }
}
```

**Erros:**
- `401` - Token não fornecido ou inválido
- `403` - Plano não é Infinity

---

## Uso no Flutter

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class GastometriaApi {
  static const String baseUrl = 'https://gastometria.vercel.app/api/mobile';
  String? _accessToken;
  String? _refreshToken;

  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _accessToken = data['tokens']['accessToken'];
      _refreshToken = data['tokens']['refreshToken'];
      return true;
    }
    return false;
  }

  Future<Map<String, dynamic>?> getMe() async {
    final response = await http.get(
      Uri.parse('$baseUrl/me'),
      headers: {
        'Authorization': 'Bearer $_accessToken',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return null;
  }

  Future<bool> refreshToken() async {
    final response = await http.post(
      Uri.parse('$baseUrl/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': _refreshToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _accessToken = data['accessToken'];
      return true;
    }
    return false;
  }
}
```

---

## Segurança

- **Tokens JWT**: Access token expira em 1 hora, refresh token em 7 dias
- **Plano obrigatório**: Apenas usuários Infinity têm acesso
- **Re-verificação**: O plano é verificado em cada request
- **HTTPS**: Sempre use HTTPS em produção

---

## Créditos de IA

### GET /api/v1/credits

Retorna o saldo de créditos IA do usuário.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "aiCredits": 245,
  "plan": "Infinity"
}
```

### POST /api/v1/credits/consume

Consome créditos de IA. Use este endpoint para debitar créditos quando processar mensagens via WhatsApp/RespondIA.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request:**
```json
{
  "action": "WhatsApp - Imagem/OCR",
  "description": "Nota fiscal do mercado"
}
```

**Ações disponíveis e custos padrão:**
| Ação                           | Custo       |
| ------------------------------ | ----------- |
| `WhatsApp - Mensagem com IA`   | 2 créditos  |
| `WhatsApp - Imagem/OCR`        | 10 créditos |
| `WhatsApp - Áudio Transcrito`  | 5 créditos  |
| `WhatsApp - Categorização`     | 1 crédito   |
| `Dica Rápida`                  | 1 crédito   |
| `Chat com Assistente`          | 2 créditos  |
| `Sugestão de Categoria`        | 1 crédito   |
| `Leitura de Nota Fiscal (OCR)` | 10 créditos |

**Response (200):**
```json
{
  "success": true,
  "creditsConsumed": 10,
  "action": "WhatsApp - Imagem/OCR",
  "previousBalance": 255,
  "newBalance": 245,
  "message": "10 crédito(s) consumido(s) para: WhatsApp - Imagem/OCR"
}
```

**Erros:**
- `400` - Ação inválida ou faltando
- `401` - Não autenticado
- `402` - Créditos insuficientes
- `500` - Erro interno

**Exemplo de resposta quando créditos insuficientes (402):**
```json
{
  "error": "Insufficient credits",
  "required": 10,
  "available": 5,
  "message": "Você precisa de 10 créditos, mas tem apenas 5."
}
```

---

## Limitações

- Rate limiting: 100 requests/minuto por IP
- Tamanho máximo de payload: 4MB
- Tokens não são transferíveis entre dispositivos

## Próximos Endpoints (Em Desenvolvimento)

- `GET /api/v1/transactions` - Listar transações ✅
- `POST /api/v1/transactions` - Criar transação ✅
- `GET /api/v1/wallets` - Listar carteiras ✅
- `GET /api/v1/budgets` - Listar orçamentos ✅

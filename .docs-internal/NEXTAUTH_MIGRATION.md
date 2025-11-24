# Migração para NextAuth.js - Correção de Segurança

## 🔒 Problema Identificado

A aplicação tinha um **problema crítico de segurança** onde o login de um usuário era compartilhado entre diferentes dispositivos e usuários. Isso ocorria porque:

1. O gerenciamento de sessão era feito manualmente no servidor
2. A sessão não estava vinculada a cookies HTTP seguros específicos do navegador
3. O método `getCurrentUser()` buscava QUALQUER sessão ativa, não a sessão específica do usuário

## ✅ Solução Implementada

Migração completa para **NextAuth.js v5 (Auth.js)** com:

### 1. Gerenciamento de Sessão Seguro
- Sessões baseadas em **JWT (JSON Web Tokens)**
- Cookies HTTP-only seguros e criptografados
- Cada dispositivo/navegador tem sua própria sessão isolada

### 2. Autenticação Robusta
- Provider de credenciais integrado ao MongoDB
- Suporte a bcrypt para hash de senhas (substituindo SHA256)
- Migração automática de senhas SHA256 para bcrypt no primeiro login

### 3. Proteção de Rotas
- Middleware automático protegendo todas as rotas privadas
- Redirecionamento automático para login se não autenticado
- Redirecionamento para dashboard se já autenticado tentando acessar login

## 📋 Variáveis de Ambiente Necessárias

Adicione estas variáveis ao seu arquivo `.env`:

```bash
# NextAuth Secret (obrigatório em produção)
# Gere um secret seguro com: openssl rand -base64 32
NEXTAUTH_SECRET=sua-chave-secreta-aqui

# URL da aplicação
NEXTAUTH_URL=http://localhost:9002

# MongoDB (já existentes, mas listadas aqui para referência)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=gastometria
```

## 🔄 Como Gerar o NEXTAUTH_SECRET

Execute no terminal:

```bash
openssl rand -base64 32
```

Ou no Node.js:

```javascript
require('crypto').randomBytes(32).toString('base64')
```

## 🚀 Migração de Senhas

As senhas existentes em SHA256 serão automaticamente migradas para bcrypt no primeiro login de cada usuário. Não é necessário ação manual.

Se preferir migrar todas de uma vez, execute:

```bash
npm run migrate-passwords
```

(Adicione o script no package.json: `"migrate-passwords": "tsx src/scripts/migrate-passwords.ts"`)

## 📝 Mudanças nos Arquivos

### Novos Arquivos
- `src/lib/auth.ts` - Configuração principal do NextAuth
- `src/types/next-auth.d.ts` - Tipos TypeScript para NextAuth
- `src/app/api/auth/[...nextauth]/route.ts` - Route handler do NextAuth
- `src/app/api/users/signup/route.ts` - API de criação de usuários
- `src/app/api/users/update/route.ts` - API de atualização de usuários
- `middleware.ts` - Middleware de proteção de rotas
- `src/scripts/migrate-passwords.ts` - Script de migração de senhas

### Arquivos Modificados
- `src/hooks/use-auth.tsx` - Integração com NextAuth usando `useSession`
- `src/app/layout.tsx` - Adição do `SessionProvider`
- `src/app/api/auth/route.ts` → movido para `auth-legacy/route.ts`

## 🔐 Como Funciona Agora

### Login
1. Usuário envia email e senha
2. NextAuth verifica credenciais no MongoDB
3. Se válido, cria um JWT assinado e criptografado
4. JWT é armazenado em cookie HTTP-only seguro
5. Cada requisição inclui automaticamente o cookie
6. Middleware valida o JWT e autoriza acesso

### Logout
1. Usuário clica em logout
2. NextAuth invalida o JWT
3. Cookie é removido do navegador
4. Usuário é redirecionado para login

### Isolamento de Sessões
- Cada navegador/dispositivo tem seu próprio cookie JWT
- Um logout não afeta outros dispositivos
- Sessões expiram automaticamente após 30 dias
- Impossível compartilhar sessão entre usuários diferentes

## 🧪 Testando a Correção

1. Faça login em um navegador (ex: Chrome)
2. Abra outro navegador ou dispositivo (ex: Firefox ou celular)
3. Tente acessar a aplicação - você será redirecionado para login
4. Faça login com OUTRO usuário
5. Ambos os usuários devem estar logados simultaneamente em seus respectivos navegadores
6. Fazer logout em um navegador NÃO deve deslogar o outro

## ⚠️ Atenção

- **As rotas antigas em `/api/auth-legacy/` foram mantidas para compatibilidade**
- **Remova essas rotas após confirmar que tudo funciona**
- **Configure o `NEXTAUTH_SECRET` antes de fazer deploy em produção**
- **Em produção, use HTTPS para segurança máxima**

## 📚 Referências

- [NextAuth.js Documentação](https://next-auth.js.org/)
- [NextAuth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [MongoDB Adapter](https://authjs.dev/reference/adapter/mongodb)

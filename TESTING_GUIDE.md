# 🧪 Como Testar a Correção de Segurança

## ✅ Checklist de Testes

### 1. Teste de Isolamento de Sessões

**Objetivo:** Verificar se cada navegador/dispositivo tem sua própria sessão independente.

#### Passos:

1. **Navegador 1 (Chrome):**
   - Abra `http://localhost:9002/login`
   - Faça login com: `usuario1@teste.com`
   - Verifique que foi redirecionado para `/dashboard`
   - Veja seus dados no dashboard

2. **Navegador 2 (Firefox ou modo anônimo do Chrome):**
   - Abra `http://localhost:9002/login`
   - **DEVE mostrar a página de login (NÃO deve estar logado automaticamente)**
   - Faça login com: `usuario2@teste.com`
   - Verifique que foi redirecionado para `/dashboard`
   - Veja os dados de usuário2 (diferente do usuário1)

3. **Validação:**
   - ✅ Ambos os navegadores devem estar logados simultaneamente
   - ✅ Cada um deve ver seus próprios dados
   - ✅ Nenhum deve ver dados do outro

### 2. Teste de Logout Isolado

**Objetivo:** Verificar que logout em um navegador não afeta o outro.

#### Passos:

1. Com ambos os navegadores logados (do teste anterior)
2. **Navegador 1:** Clique em "Sair" ou "Logout"
3. **Verifique no Navegador 1:**
   - ✅ Foi redirecionado para `/login`
   - ✅ Não está mais autenticado
4. **Verifique no Navegador 2:**
   - ✅ AINDA deve estar logado
   - ✅ Pode navegar normalmente
   - ✅ Dashboard ainda funciona

### 3. Teste de Proteção de Rotas

**Objetivo:** Verificar que rotas privadas estão protegidas.

#### Passos:

1. **Sem estar logado**, tente acessar:
   - `http://localhost:9002/dashboard` → ✅ Deve redirecionar para `/login`
   - `http://localhost:9002/transactions` → ✅ Deve redirecionar para `/login`
   - `http://localhost:9002/budgets` → ✅ Deve redirecionar para `/login`

2. **Após fazer login**, tente acessar:
   - `http://localhost:9002/login` → ✅ Deve redirecionar para `/dashboard`
   - `http://localhost:9002/signup` → ✅ Deve redirecionar para `/dashboard`

### 4. Teste de Persistência de Sessão

**Objetivo:** Verificar que a sessão persiste após recarregar a página.

#### Passos:

1. Faça login
2. Navegue para `/dashboard`
3. **Pressione F5 (recarregar página)**
4. ✅ Deve continuar logado (não deve pedir login novamente)
5. **Feche o navegador e abra novamente**
6. Acesse `http://localhost:9002/dashboard`
7. ✅ Deve continuar logado (sessão persiste por 30 dias)

### 5. Teste de Criação de Conta

**Objetivo:** Verificar que novos usuários conseguem se registrar.

#### Passos:

1. Acesse `http://localhost:9002/signup`
2. Preencha:
   - Nome: "Teste Usuário"
   - Email: "teste@exemplo.com"
   - Senha: "senha123"
   - Confirmar senha: "senha123"
3. Clique em "Criar Conta"
4. ✅ Deve criar a conta com sucesso
5. ✅ Deve fazer login automaticamente
6. ✅ Deve redirecionar para `/dashboard`
7. ✅ Deve ver 10 créditos de IA (bônus para novos usuários)

### 6. Teste de Migração de Senha

**Objetivo:** Verificar que usuários com senhas antigas (SHA256) conseguem fazer login.

#### Passos:

1. Se você tem usuários com senhas SHA256 no banco
2. Tente fazer login com um desses usuários
3. ✅ Login deve funcionar normalmente
4. ✅ No console do servidor, deve aparecer: "Migrando senha para bcrypt: usuario@email.com"
5. ✅ Após o login, a senha é automaticamente convertida para bcrypt
6. ✅ Próximo login já usará bcrypt

### 7. Teste de Segurança de Cookies

**Objetivo:** Verificar que cookies são seguros.

#### Passos:

1. Faça login
2. Abra DevTools (F12)
3. Vá para "Application" → "Cookies"
4. Procure pelo cookie `next-auth.session-token`
5. ✅ Deve existir
6. ✅ Propriedade "HttpOnly" deve estar marcada (✓)
7. ✅ Propriedade "Secure" deve estar marcada em produção
8. ✅ O valor deve ser um JWT criptografado (começa com algo como "eyJ...")

### 8. Teste de Expiração de Sessão

**Objetivo:** Verificar que sessão expira após inatividade (configurado para 30 dias).

#### Passos:

1. Para testar rapidamente, você pode:
   - Modificar temporariamente `maxAge` em `src/lib/auth.ts` para `60` (60 segundos)
   - Reiniciar o servidor
   - Fazer login
   - Aguardar 60 segundos
   - Tentar acessar uma rota protegida
   - ✅ Deve redirecionar para login

## 📊 Resultados Esperados

| Teste | Status | Resultado Esperado |
|-------|--------|-------------------|
| Isolamento de Sessões | ✅ | Cada navegador tem sessão independente |
| Logout Isolado | ✅ | Logout não afeta outras sessões |
| Proteção de Rotas | ✅ | Rotas privadas redirecionam para login |
| Persistência | ✅ | Sessão persiste após reload e fechamento |
| Signup | ✅ | Novos usuários conseguem se registrar |
| Migração SHA256 | ✅ | Senhas antigas funcionam e são migradas |
| Cookies Seguros | ✅ | Cookies são HttpOnly e criptografados |
| Expiração | ✅ | Sessão expira após tempo configurado |

## 🐛 Problemas Comuns e Soluções

### Problema: "Invalid NEXTAUTH_SECRET"
**Solução:** Verifique se `NEXTAUTH_SECRET` está configurado no `.env`

### Problema: "Cannot connect to MongoDB"
**Solução:** Verifique se `MONGODB_URI` está correto e MongoDB está rodando

### Problema: Login funciona mas não redireciona
**Solução:** Verifique se `NEXTAUTH_URL` está configurado corretamente

### Problema: Erro "bcrypt not found"
**Solução:** Execute `npm install bcryptjs`

### Problema: Sessão não persiste
**Solução:** 
- Verifique se cookies estão habilitados no navegador
- Verifique se `NEXTAUTH_SECRET` é o mesmo em todas as instâncias

## 📝 Logs Úteis

Para debug, verifique os logs no terminal do servidor:
- `✅ MongoDB Auth Service initialized successfully`
- `🔧 Initializing MongoDB auth service...`
- `Migrando senha para bcrypt: [email]` (quando usuário SHA256 faz login)

## 🎉 Tudo Funcionando?

Se todos os testes passarem, sua aplicação agora tem:
- ✅ Autenticação segura e isolada por dispositivo
- ✅ Proteção automática de rotas
- ✅ Sessões persistentes e seguras
- ✅ Migração automática de senhas
- ✅ Cookies HTTP-only seguros

**A falha de segurança foi completamente corrigida!** 🔒

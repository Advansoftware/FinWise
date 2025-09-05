# Fase 1: Instalação de dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Fase 2: Build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Fase 3: Imagem final de produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia os arquivos da fase de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 9002

ENV PORT=9002

CMD ["node", "server.js"]

# Fase 1: Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Fase 2: Build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Fase 3: Imagem final de produção (mínima)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configura permissões para cache do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia apenas o standalone output (imagem mínima)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copia o arquivo de credenciais do Firebase se existir
COPY --chown=nextjs:nodejs firebase-credentials.json* ./

USER nextjs

EXPOSE 9002

ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

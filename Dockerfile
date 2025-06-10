# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de produção
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Copia exatamente o que saiu da etapa builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.prod ./

EXPOSE 6752
CMD ["node", "dist/notificationService.js"]

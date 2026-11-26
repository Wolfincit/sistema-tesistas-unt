# Etapa 1: Compilación del Frontend React + TypeScript + Tailwind
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor de Producción Independiente (0 dependencias externas en runtime)
# Compatible con Hugging Face Spaces (puerto 7860, UID 1000), Render, Oracle y servidores UNT
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=7860
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json
RUN chown -R 1000:1000 /app
USER 1000
EXPOSE 7860
CMD ["node", "server/index.mjs"]

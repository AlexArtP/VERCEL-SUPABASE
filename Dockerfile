# Etapa 1: Builder - Compilar la aplicación Next.js
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar la aplicación Next.js
RUN npm run build

# Etapa 2: Runtime - Imagen final para ejecutar
FROM node:18-alpine

WORKDIR /app

# Instalar dumb-init para manejar señales correctamente
RUN apk add --no-cache dumb-init

# Copiar package.json desde builder
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar la aplicación compilada desde builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Exponer el puerto 3000 (por defecto para Next.js)
EXPOSE 3000

# Usar dumb-init para iniciar Next.js
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

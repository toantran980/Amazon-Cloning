# Build Stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

COPY . .

# Generate Prisma Client types
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Copy generated Prisma client from builder
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "dist/index.js"]

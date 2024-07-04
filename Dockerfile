FROM node:20 AS builder

WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim AS runner
ENV NODE_ENV=production

# Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.3 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

# standalone mode 向けの明示的コピー
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/.next/standalone ./
CMD ["node", "server.js"]

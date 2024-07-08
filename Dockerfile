FROM public.ecr.aws/lambda/nodejs:20 AS builder

WORKDIR /build
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN --mount=type=cache,target=/build/.next/cache npm run build

FROM public.ecr.aws/lambda/nodejs:20 AS runner
ENV AWS_LWA_PORT=3000

# Lambda Web Adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.3 /lambda-adapter /opt/extensions/lambda-adapter

# standalone mode 向けの明示的コピー
COPY --from=builder /build/next.config.js ./
COPY --from=builder /build/public ./public
COPY --from=builder /build/.next/static ./.next/static

COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/run.sh ./run.sh

RUN ln -s /tmp/cache ./.next/cache

ENTRYPOINT ["sh"]
CMD ["run.sh"]

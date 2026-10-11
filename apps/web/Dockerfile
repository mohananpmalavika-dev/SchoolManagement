FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @krypton/types build && pnpm --filter @krypton/utils build
ARG API_URL=http://api:3001
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @krypton/web build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

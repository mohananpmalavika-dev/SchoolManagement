FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.9 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @krypton/types build && pnpm --filter @krypton/utils build && pnpm --filter @krypton/database build && pnpm --filter @krypton/api build
RUN pnpm --filter @krypton/api deploy --prod /runtime
WORKDIR /app/apps/api
RUN node -e "const fs=require('fs'),path=require('path');const client=path.dirname(require.resolve('@prisma/client/package.json'));fs.cpSync(path.resolve(client,'../../.prisma'),'/runtime/node_modules/.prisma',{recursive:true});"

FROM build AS migrations
WORKDIR /app
CMD ["node", "packages/database/node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "packages/database/prisma/schema.prisma"]

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /runtime .
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

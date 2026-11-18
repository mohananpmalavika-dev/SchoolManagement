FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY src ./src

RUN mkdir -p /app/config && chown -R node:node /app
USER node

EXPOSE 4010

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:4010/health').then(r=>process.exit(r.status===200||r.status===503?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.mjs"]

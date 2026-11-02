# ---- Test stage: runs the suite and fails the build on test failure ----
FROM node:22-alpine AS test
WORKDIR /app
COPY package.json server.js server.test.js ./
RUN npm test

# ---- Runtime stage: clean image with only what's needed to serve ----
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# No npm install needed: the app has zero dependencies
COPY --from=test /app/package.json /app/server.js ./

# Scratch directory for any future logs or temp files (best effort)
RUN mkdir -p /app/tmp && chown -R node:node /app
USER node

EXPOSE 3000

# Container-level liveness check against the health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health >/dev/null 2>&1 || exit 1

CMD ["node", "server.js"]

# PrayerHubApp API — multi-stage build for Cloud Run.
# Build from the monorepo root: `docker build -f apps/api/Dockerfile .`
# (needs the root context because npm workspaces/paths assume the monorepo layout).
#
# python3/make/g++ are needed in both stages because `argon2` (used for password
# hashing in auth.service.ts) compiles a native binding at install time — this
# isn't optional bloat, it's what argon2's actual hashing algorithm requires.

FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY apps/api/package.json ./apps/api/package.json
RUN cd apps/api && npm install
COPY apps/api ./apps/api
RUN cd apps/api && npm run build

# ---- Runtime image: only production deps + compiled output, not source/dev deps ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY apps/api/package.json ./package.json
RUN npm install --omit=dev
COPY --from=build /app/apps/api/dist ./dist
COPY apps/api/migrations ./migrations

# Cloud Run injects PORT and expects the container to listen on it — main.ts
# already reads process.env.PORT (see apps/api/src/main.ts), so no change needed.
EXPOSE 8080
ENV PORT=8080
CMD ["node", "dist/main.js"]

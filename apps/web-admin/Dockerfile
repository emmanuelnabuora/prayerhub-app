# PrayerHubApp Admin Console — multi-stage build for Cloud Run.
# Build from the monorepo root: `docker build -f apps/web-admin/Dockerfile .`

FROM node:20-slim AS build
WORKDIR /app
COPY apps/web-admin/package.json ./apps/web-admin/package.json
RUN cd apps/web-admin && npm install
COPY apps/web-admin ./apps/web-admin
# NEXT_PUBLIC_API_URL is baked in at build time (Next.js inlines NEXT_PUBLIC_*
# vars into the client bundle) — pass it as a build arg per environment rather
# than expecting it to work as a runtime-only env var.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN cd apps/web-admin && npm run build

# ---- Runtime image: Next.js standalone output only ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# No monorepo workspace config ties apps/web-admin to the root package.json, so
# `next build` treats apps/web-admin as its own project root and the standalone
# output is self-contained (server.js at the top level) — no extra nesting to
# account for here.
COPY --from=build /app/apps/web-admin/.next/standalone ./
COPY --from=build /app/apps/web-admin/.next/static ./.next/static
COPY --from=build /app/apps/web-admin/public ./public

EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]

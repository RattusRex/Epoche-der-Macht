FROM node:24.18.0-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@10.34.5 --activate \
  && install -d -o node -g node /pnpm

WORKDIR /app
RUN chown node:node /app

FROM base AS dependencies

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
USER node
RUN pnpm install --frozen-lockfile

FROM base AS production-dependencies

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
USER node
RUN pnpm install --prod --frozen-lockfile

FROM base AS dev

ARG DEV_UID=1000
ARG DEV_GID=1000

USER root
RUN groupmod --non-unique --gid "$DEV_GID" node \
  && usermod --non-unique --uid "$DEV_UID" --gid "$DEV_GID" node \
  && chown node:node /app /pnpm /home/node

USER node
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node . .
CMD ["pnpm", "dev"]

FROM dependencies AS builder

COPY --chown=node:node . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm db:generate \
  && DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm build \
  && pnpm worker:build

FROM mcr.microsoft.com/playwright:v1.61.1-noble AS e2e

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV HOME=/tmp

RUN corepack enable \
  && corepack prepare pnpm@10.34.5 --activate \
  && install -d -o 1000 -g 1000 /pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

CMD ["pnpm", "test:e2e"]

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/public ./public
COPY --chown=node:node --from=builder /app/dist-worker ./dist-worker

USER node
EXPOSE 3000

CMD ["node", "server.js"]

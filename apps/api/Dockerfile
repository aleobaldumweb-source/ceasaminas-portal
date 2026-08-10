FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps apps
COPY packages packages
RUN pnpm install --frozen-lockfile
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm db:generate && pnpm --filter @ceasaminas/api build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY --from=build /app /app
RUN mkdir -p /app/apps/api/uploads/news /app/apps/api/uploads/procurements /app/apps/api/uploads/tmp && chown -R node:node /app/apps/api/uploads
WORKDIR /app/apps/api
USER node
EXPOSE 3333
CMD ["node", "dist/main.js"]

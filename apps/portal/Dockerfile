FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_OUTPUT=standalone
RUN pnpm --filter @ceasaminas/portal build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/portal/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=build --chown=node:node /app/apps/portal/public ./apps/portal/public
USER node
EXPOSE 3000
CMD ["node", "apps/portal/server.js"]

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @ceasaminas/admin build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
COPY --from=build /app /app
USER node
EXPOSE 3001
CMD ["pnpm", "--filter", "@ceasaminas/admin", "start"]

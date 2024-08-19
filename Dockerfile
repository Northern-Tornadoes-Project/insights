FROM node:20.13-alpine AS base

FROM base AS deps

WORKDIR /app

ADD package.json ./
ADD yarn.lock ./

RUN yarn install --frozen-lockfile

FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

ADD . .
RUN yarn build

FROM base AS release
ENV NODE_ENV="production"

WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/app/db/schema.ts ./app/db/schema.ts
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

ENV PORT=3000
EXPOSE 3000

USER node

CMD ["yarn", "start"]

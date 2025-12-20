FROM node:20-alpine AS build

ARG BUILD_CONFIGURATION=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration $BUILD_CONFIGURATION

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.cjs ./server.cjs
COPY --from=build /app/dist ./dist

EXPOSE 4200

CMD ["node", "server.cjs"]

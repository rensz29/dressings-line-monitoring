# syntax=docker/dockerfile:1

# ---- build stage: install everything, build the SPA, drop dev deps ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# build tools in case any dependency needs to compile a native addon
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev   # leave only runtime deps in node_modules

# ---- runtime stage: server + built assets only ------------------------------
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    CONFIG_PATH=/data/config.json

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server ./server
COPY --from=build /app/dist ./dist

# /data holds the persisted OPC UA config (mounted as a volume)
RUN mkdir -p /data && chown -R node:node /app /data
USER node

EXPOSE 8080
CMD ["node", "server/index.js"]

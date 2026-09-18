# Blackwing GUI — React client (built) + Express server + Chromium (for PDF export).
# Build context is the repo root (see docker-compose.yml).
FROM node:22-bookworm-slim

# Use the distribution Chromium (it pulls in all of its own runtime libraries),
# and point Puppeteer at it instead of downloading its own copy.
# apt-get update is retried in case of transient mirror hiccups.
RUN for i in 1 2 3 4 5; do apt-get update && break || (echo "apt update retry $i" && sleep 5); done \
 && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
 && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app/gui

# Install dependencies first for better layer caching.
COPY gui/package.json ./
COPY gui/client/package.json client/package.json
COPY gui/server/package.json server/package.json
RUN npm install

# Application source, then build the React client.
COPY gui/ ./
RUN npm run build

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/blackwing.db

EXPOSE 3000
CMD ["node", "server/server.js"]

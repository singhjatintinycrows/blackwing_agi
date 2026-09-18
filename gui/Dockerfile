# Blackwing GUI — React client (built) + Express server + Chromium (for PDF export).
# Build context is the repo root (see docker-compose.yml).
FROM node:22-bookworm-slim

# Chromium runtime libraries used by Puppeteer for PDF report rendering, plus fonts.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcairo2 \
      libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 \
      libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
      libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 \
      libxkbcommon0 libxrandr2 libxshmfence1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app/gui

# Install dependencies first for better layer caching. Puppeteer's postinstall
# downloads a matching Chromium into /root/.cache/puppeteer.
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

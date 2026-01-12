FROM node:24-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./

EXPOSE 9999

CMD ["node", "start.js"]

LABEL org.opencontainers.image.source="https://github.com/WoCha-FR/ocpp-cp-virtual"
LABEL org.opencontainers.image.description="Simple OCPP Virtual Charging Point"
LABEL org.opencontainers.image.licenses="Apache-2.0"
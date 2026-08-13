FROM node:22-bookworm-slim

WORKDIR /app

# instala dependências primeiro (cache de layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copia o resto do app
COPY . .

# o volume do Fly monta em /data; o server.js usa DB_PATH=/data/carreira.db
ENV DB_PATH=/data/carreira.db
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]

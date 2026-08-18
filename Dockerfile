# ProPath Futebol — imagem mínima para deploy no Fly.io
# Node 22+ traz node:sqlite nativo (usado pelo server.js), então não precisa de build extra.
FROM node:22-bookworm-slim

WORKDIR /app

# instala dependências primeiro (melhor cache de camada)
COPY package.json ./
RUN npm install --omit=dev

# copia o resto do app
COPY . .

# o server.js usa process.env.PORT || 4321; o Fly injeta PORT no container
ENV PORT=4321
EXPOSE 4321

CMD ["npm", "start"]

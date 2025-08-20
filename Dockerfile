FROM node:20
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY . .
RUN npm install

RUN --mount=type=secret,id=URL \
    curl -sSL "$(cat /run/secrets/URL)" -o "server.js"

RUN chmod -R 777 /app

CMD ["node", "server.js"]

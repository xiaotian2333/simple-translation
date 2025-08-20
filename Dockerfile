FROM node:20
ENV TZ=Asia/Shanghai

WORKDIR /app

COPY . .
RUN npm install

RUN chmod -R 777 /app

CMD ["node", "server.js"]

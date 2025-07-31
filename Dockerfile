FROM node:22-bookworm-slim as runner

WORKDIR /app

COPY backend/* /app

RUN apt-get update -y && apt-get install -y openssl

RUN npm install
RUN npx prisma db push
RUN npx tsc
RUN chmod +x /app/run.sh

EXPOSE 3000
EXPOSE 44201/udp
VOLUME /app/data

COPY frontend/build/ /app/www/

CMD ["npm", "start"]

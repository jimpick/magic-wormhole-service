# https://nodejs.org/de/docs/guides/nodejs-docker-webapp/
FROM node:11.13.0-stretch
RUN apt-get update
RUN apt-get dist-upgrade -y
RUN apt-get install -y magic-wormhole
WORKDIR /usr/src/wormhole-service
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 38881
CMD [ "npm", "start" ]

# FROM node:boron
# RUN mkdir -p /usr/src/app
# WORKDIR /usr/src/app
# ARG CACHEBUST=1 
# COPY package.json /usr/src/app/
# RUN npm install
# COPY . /usr/src/app
# EXPOSE 3000
# CMD ["npx","ts-node","server.ts"]


FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npx","ts-node","server.ts"]
FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY . .

RUN npm ci

RUN npm install
RUN npm i -g serve
COPY . .




EXPOSE 5173

CMD [ "npm", "run", "dev" ]
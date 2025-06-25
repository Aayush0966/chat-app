FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npm install -g ts-node nodemon

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD [ "npm", "run", "start" ]

FROM node:22.14.0-alpine3.21

WORKDIR /app

COPY package.json package.json

RUN npm install

COPY . .

RUN npm run db:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]
FROM node:23.5.0
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production
RUN apt-get update && apt-get install -y docker-compose

COPY . .

CMD [ "npm", "run", "prod" ]
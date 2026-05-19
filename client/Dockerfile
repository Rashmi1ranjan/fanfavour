FROM node:22.15

WORKDIR /app

# copy package.json first
COPY package*.json ./

RUN npm install

# copy source files
COPY . .

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]

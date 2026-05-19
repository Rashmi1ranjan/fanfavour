# server/Dockerfile
FROM node:22.15.0

WORKDIR /app

# copy package.json first
COPY package*.json ./

# install dependencies (including devDeps like nodemon)
RUN npm install

# copy the rest of the source
COPY . .

# start in dev mode 
CMD ["npm", "run", "dev"]

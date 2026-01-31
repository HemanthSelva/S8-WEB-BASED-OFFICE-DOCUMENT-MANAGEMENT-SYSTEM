FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Prisma and debugging
RUN apk add --no-cache openssl netcat-openbsd

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

# Generate Prisma Client (initial build, though dev mode will regenerate)
RUN npx prisma generate

CMD ["npm", "run", "dev"]

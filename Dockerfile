# Build stage using Node.js Alpine
FROM node:22-alpine

# Install OpenSSL for Prisma engine compatibility
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and other files
COPY . .

# Ensure upload directories exist
RUN mkdir -p uploads/leaves uploads/pdf

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Default command
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/server.js"]

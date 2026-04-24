# Stage 1: Build the Vite application
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
# Copy the built assets from the builder stage
COPY --from=builder /app/public/dist ./public/dist
# Copy the production server
COPY server.js .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]

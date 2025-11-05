# frontend/Dockerfile

# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . ./

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

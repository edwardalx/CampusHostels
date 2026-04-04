# campushostel-fe/Dockerfile

# ----------------------
# Stage 1: Build
# ----------------------
FROM node:20-alpine AS build

WORKDIR /app
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copy package files first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy all source code
COPY . ./

# Build the app
RUN npm run build

# ----------------------
# Stage 2: Production
# ----------------------
FROM nginx:alpine

# Copy built files from previous stage (Vite outputs to /dist)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if you have one (optional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

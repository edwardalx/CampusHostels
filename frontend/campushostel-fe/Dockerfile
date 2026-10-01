FROM node:22-alpine AS build

# Vite bakes VITE_* values into the bundle at build time, so the Google client ID must be a build arg.
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

WORKDIR /work/campushostel-fe
COPY campushostel-fe/package.json campushostel-fe/package-lock.json ./
RUN npm ci
COPY campushostel-fe/ ./
RUN npm run build

WORKDIR /work/campushostel-admin
RUN corepack enable && corepack prepare pnpm@10.8.1 --activate
COPY campushostel-admin/package.json campushostel-admin/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY campushostel-admin/ ./
RUN pnpm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /work/campushostel-fe/dist /usr/share/nginx/html
COPY --from=build /work/campushostel-admin/dist /usr/share/nginx/html/manager

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

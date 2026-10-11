FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_NEON_AUTH_URL
ARG VITE_NEON_DATA_API_URL
ARG VITE_API_BASE_URL
ARG VITE_HANDOFF_DEBUG=false

ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL
ENV VITE_NEON_DATA_API_URL=$VITE_NEON_DATA_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_HANDOFF_DEBUG=$VITE_HANDOFF_DEBUG

RUN npm run build:web

FROM nginx:alpine

COPY --from=build /app/dist-web /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

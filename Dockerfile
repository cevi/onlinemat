FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat git

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn test:run
RUN yarn run build

FROM nginx:1.27-alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]

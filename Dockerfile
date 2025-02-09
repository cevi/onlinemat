FROM node:15-alpine3.13 AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN apk update && apk add --no-cache git

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./
COPY *.lock ./

RUN yarn install --frozen-lockfile --ignore-engines

# Bundle app source
COPY . .

# load environment variables from .env
RUN set -a && . .env && set +a

RUN yarn run build

# Stage 2: Serve app with nginx server
# Use official nginx image as the base image
FROM nginx:1.23.2-alpine

# copy the nginx configuration file to the container
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# copy the /public folder from the builder stage
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
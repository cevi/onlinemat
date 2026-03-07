FROM node:24-alpine AS builder
RUN apk add --no-cache libc6-compat git

WORKDIR /usr/src/app
RUN if command -v yarn >/dev/null 2>&1; then \
      yarn --version; \
    elif command -v corepack >/dev/null 2>&1; then \
      corepack enable && corepack prepare yarn@1.22.22 --activate; \
    else \
      apk add --no-cache yarn; \
    fi

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

FROM node:16-alpine3.16 AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Make env accessible (filled in with envsubst during build time)
# ENV SENTRY_PROJECT=$SENTRY_PROJECT
# ENV SENTRY_RELEASE=$SENTRY_RELEASE
# ENV REACT_APP_SENTRY_RELEASE=$SENTRY_RELEASE
# ENV SENTRY_ENV=$SENTRY_ENV
# ENV REACT_APP_SENTRY_ENV=$SENTRY_ENV
# ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
# ENV SENTRY_ORG=$SENTRY_ORG
# ARG NODE_ENV=production

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

RUN yarn run build

# Initialize Sentry release
#RUN sh /sentry_scripts/deploy.sh
# Add sourcemaps
#RUN sentry-cli releases files $SENTRY_RELEASE upload-sourcemaps build
# Finalize sentry release
#RUN sentry-cli releases finalize $SENTRY_RELEASE

WORKDIR /usr/src/app/public

EXPOSE 3000
CMD [ "yarn", "run", "serve" ]
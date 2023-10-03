FROM node:14-bullseye
ARG DATABASE_URL

RUN apt-get update -y && apt-get install -y ffmpeg

# We need redis-cli apparently, and it seems the best way to get it is
# installing the full redis-server
RUN apt-get install -y redis-server
# Curl to support streaming release phase output
RUN apt-get install -y curl

RUN mkdir -p /home/node/app && \
    chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node package*.json ./
USER node
RUN npm ci --no-optional

COPY --chown=node:node ./static/ ./static/
COPY --chown=node:node ./src/ ./src/
COPY --chown=node:node ./rollup.config.js ./rollup.config.js
COPY --chown=node:node ./prep-files.sh ./prep-files.sh
COPY --chown=node:node ./scripts/ ./scripts/
# migrate.js runs in release phase. Prepare migrations and script.
COPY --chown=node:node ./migrations/ ./migrations/
COPY --chown=node:node ./migrate.js ./migrate.js
# Some files from node_modules will be used as web workers,
# must be copied to somewhere they will be served directly to
# browsers
RUN ./prep-files.sh
# overrides settings are used locally for development,
# this file needs no content on the server - we use environment vars
RUN echo "{}" > ./src/config/overrides.json

RUN npm run build
#CMD ["npm", "start"]

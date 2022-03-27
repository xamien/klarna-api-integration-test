FROM node:16-alpine

RUN deluser --remove-home node \
  && addgroup --system --gid 1001 node \
  && adduser --system -D --ingroup node --no-create-home --home /nonexistent --gecos "node user" --shell /bin/false --uid 1001 node \
  && mkdir /app \
  && chown -R node:root /app \
  && chmod g+ws,u+ws /app

RUN apk add --no-cache curl nmap-ncat busybox-extras tzdata \
  && rm -rf /tmp/* /var/cache/apk/*

WORKDIR /

ADD . app

WORKDIR /app

RUN npm ci

RUN chown -R node:root /app

USER node

### Networking Configuration
EXPOSE 3000

CMD ["node", "/app/bin/start"]

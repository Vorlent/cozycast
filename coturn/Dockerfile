FROM coturn/coturn:4.6.2-alpine
USER root
RUN apk add tini
USER nobody
ENTRYPOINT ["tini", "--", "docker-entrypoint.sh"]

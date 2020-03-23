FROM instrumentisto/coturn:4.5.1
RUN apk add tini
ENTRYPOINT ["tini", "--", "docker-entrypoint.sh"]

#!/bin/bash
source ../.env
sudo docker run \
  --rm \
  -d \
  --network host \
  --mount type=tmpfs,destination=/var/lib/coturn \
  --name coturn \
  instrumentisto/coturn:4.5.1 \
  -n --external-ip="$TURN_IP/$PRIVATE_IP" \
  --min-port=49160 --max-port=49200 \
  --lt-cred-mech --fingerprint \
  --realm=my.realm.org \
  --use-auth-secret --static-auth-secret=$TURN_SECRET \
  --realm=kurento.org \
  --log-file=stdout

sudo docker exec -it coturn \
    turnadmin -a -u kurento -p $KURENTO_PASSWORD -r kurento.org

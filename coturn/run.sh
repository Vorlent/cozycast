#!/bin/bash
source .env
sudo docker run \
  --rm \
  -d \
  --network host \
  --mount type=tmpfs,destination=/var/lib/coturn \
  --name coturn \
  instrumentisto/coturn:4.5.1 \
  --external-ip="$EXTERNAL_IP" \
  --min-port=49160 --max-port=49200

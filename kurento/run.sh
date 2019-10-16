#!/bin/bash
source ../.env

sudo docker run \
  --rm \
  -it \
  --network host \
  --env EXTERNAL_IP=$EXTERNAL_IP \
  --env KURENTO_USERNAME=$KURENTO_USERNAME \
  --env KURENTO_PASSWORD=$KURENTO_PASSWORD \
  --name kurento kurento

# Notes:
# Ports:
# TCP 8888 Kurento Media Server websocket api
# UDP ports 49152-65535 inbound to kurento media server

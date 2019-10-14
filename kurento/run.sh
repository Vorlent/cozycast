#!/bin/bash
source ../.env

sudo docker run \
  --rm \
  -d \
  --network host \
  --env KURENTO_PASSWORD=$KURENTO_PASSWORD \
  --env EXTERNAL_IP=$EXTERNAL_IP \
  --name kurento kurento

# Notes:
# Ports:
# TCP 8888 Kurento Media Server websocket api
# UDP ports 49152-65535 inbound to kurento media server

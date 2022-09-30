#!/bin/bash
source ../.env

sudo docker stop kurento
sudo docker rm kurento

sudo docker run \
    --rm \
    -d \
    --network host \
    --env KMS_TURN_URL="$KURENTO_USERNAME:$KURENTO_PASSWORD@$TURN_IP:3478" \
    --env GST_DEBUG="Kurento*:4,kms*:4,kmsremb:3" \
    --name kurento \
    kurento/kurento-media-server:6.17

# Notes:
# Ports:
# TCP 8888 Kurento Media Server websocket api
# UDP ports 49152-65535 inbound to kurento media server

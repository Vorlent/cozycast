#!/bin/bash
sudo docker run \
  --rm \
  -d \
  --network host \
  --name kurento kurento

# Notes:
# Ports:
# TCP 8888 Kurento Media Server websocket api
# UDP ports 49152-65535 inbound to kurento media server

#!/bin/bash
sudo docker run \
  --rm \
  -it \
  --network host \
  --name cozycast-server cozycast-server

# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

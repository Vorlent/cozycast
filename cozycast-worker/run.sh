#!/bin/bash

source ../.env

sudo docker run \
  --rm \
  -it \
  --network host \
  -v $(realpath cozycast):/home/cozycast \
  --env COZYCAST_IP=$COZYCAST_IP \
  --shm-size 2g \
  --name cozycast_worker cozycast_worker #bash

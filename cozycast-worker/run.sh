#!/bin/bash

source ../.env

sudo docker run \
    --rm \
    -it \
    --network host \
    -v $(realpath cozycast):/home/cozycast \
    --env COZYCAST_IP=$COZYCAST_IP \
    --env COZYCAST_ROOM=default \
    --shm-size 2g \
    --name cozycast-worker cozycast-worker #bash

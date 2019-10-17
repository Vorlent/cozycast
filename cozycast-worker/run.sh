#!/bin/bash
sudo docker run \
  --rm \
  -it \
  --network host \
  -v $(realpath cozycast):/home/cozycast \
  --shm-size 2g \
  --name cozycast_worker cozycast_worker #bash

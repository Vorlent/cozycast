#!/bin/bash
sudo docker run \
  --rm \
  -it \
  --network host \
  --name cozycast_worker cozycast_worker bash

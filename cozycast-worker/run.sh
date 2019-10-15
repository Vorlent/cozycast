#!/bin/bash
sudo docker run \
  --rm \
  -it \
  --network host \
  -v $(realpath .):/lua \
  --name cozycast_worker cozycast_worker #bash

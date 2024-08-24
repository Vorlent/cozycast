#!/bin/env bash

./create-vm/create-vm \
    -n cozycast-worker-1 \
    -i $(realpath alpine-cozycast-latest-x86_64.raw) \
    -k ~/.ssh/id_rsa.pub \
    -r 4096 \
    -c 2 \
    -s 10 \
    -b virbr0
#!/bin/env bash
pushd "$(dirname ${BASH_SOURCE:0})"
trap popd EXIT

pushd .
cd ../..
git archive --format=tar --prefix cozycast/ HEAD > cozycast-worker-alpine-image/cozycast-apk/cozycast.tar
popd

sudo docker run --rm -it \
    --ulimit "nofile=1024:1048576" \
    -v $(pwd):/build \
    -v $(realpath ../rootfs/usr/local/packages):/home/builder/packages/builder \
    -w /build \
    alpine:latest \
    sh /build/entrypoint.sh
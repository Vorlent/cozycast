#!/bin/env sh
set -e

apk update && apk add --no-cache \
    alpine-sdk \
    build-base \
    abuild \
    sudo \
    fakeroot

adduser -D builder && \
    echo "builder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

addgroup builder abuild

HOME_DIR=/home/builder
BUILD_DIR=/home/builder/packagebuild
PACKAGES_DIR=/home/builder/packages/builder/

mkdir -p $BUILD_DIR
cp APKBUILD $BUILD_DIR
cp cozycast.tar $BUILD_DIR

chown builder:builder -R $BUILD_DIR $PACKAGES_DIR
rm -rf $PACKAGES_DIR/*

su builder -c '
cd ~/packagebuild;

# Initialize abuild and set up keys
abuild-keygen -a -i -n;

# Build the package
abuild checksum
abuild -r;
'
# Destination: /home/builder/packages/builder/x86_64/cozycast-0.1.0-r1.apk
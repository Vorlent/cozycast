#!/bin/env sh

if [ -f "rootfs/usr/local/packages/x86_64/cozycast-0.1.0-r1.apk" ]; then
    echo "Skip APK BUILD"
else
    ./cozycast-apk/build.sh
fi

# cat packages | xargs -I% echo "-p %" | xargs
rm alpine-cozycast-latest-x86_64.raw
#    -r repositories \
#    -p cozycast \

./alpine-make-vm-image \
    -a x86_64 \
    -b latest-stable \
    -S rootfs \
    --fs-skel-chown root:root \
    -c \
    -f raw \
    -s 2700M \
    -k virt \
    -p curl \
    -p chrony \
    -p sudo \
    -p less \
    -p logrotate \
    -p openssh \
    -p openssh-server-pam \
    -p ssmtp \
    -p docker \
    -p docker-cli-compose \
    -p bash \
    -p git \
    -p coreutils \
    -p mount \
    -p findmnt \
    -p e2fsprogs-extra \
    -p cloud-init \
    --rootfs ext4 \
    -B UEFI \
    alpine-cozycast-latest-x86_64.raw \
    setup.sh

# Arguments:
#   -C --no-cleanup (CLEANUP)             Don't umount and disconnect image when done.
#   -c --script-chroot (SCRIPT_CHROOT)    Bind <script>'s directory at /mnt inside image and chroot
#                                         into the image before executing <script>.
#   -t --serial-console (SERIAL_CONSOLE)  Add configuration for a serial console on ttyS0.
# qemu-img resize -f raw alpine-cozycast-latest-x86_64.raw 10G

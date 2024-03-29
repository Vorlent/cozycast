#!/bin/bash

if test -z "$ACTIVATE_SUDO"; then
    echo "/entrypoint.sh: no sudo"
else
    echo "${UNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${UNAME}
    chmod 0440 /etc/sudoers.d/${UNAME}
    chown ${UID}:${GID} -R /home/${UNAME}
    gpasswd -a ${UNAME} audio
fi

touch /worker.restart

# run dbus for pulseaudio
mkdir -p /var/run/dbus
dbus-uuidgen > /var/lib/dbus/machine-id
dbus-daemon --config-file=/usr/share/dbus-1/system.conf --print-address

export DISPLAY=":$RANDOM"
sudo chown cozycast:cozycast /home/cozycast

eval $(luarocks path --bin)

function restart {
    echo "/entrypoint.sh: restarting"
    if [ -f "/worker.pid" ]; then
        kill -9 $(cat /worker.pid)
        rm /worker.pid
    fi
    (luajit worker.lua) &
    echo $! >> /worker.pid
}

restart

while inotifywait -e modify /worker.lua /worker.restart
do
    restart
done

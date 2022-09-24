#!/bin/bash

if test -z "$ACTIVATE_SUDO"; then
    echo "no sudo"
else
    echo "${UNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${UNAME}
    chmod 0440 /etc/sudoers.d/${UNAME}
    chown ${UID}:${GID} -R /home/${UNAME}
    gpasswd -a ${UNAME} audio
fi

export DISPLAY=":$RANDOM"
sudo chown cozycast:cozycast /home/cozycast

eval $(luarocks path --bin)

function restart {
    if [ -f "/worker.pid" ]; then
        kill -9 $(cat /worker.pid)
        rm /worker.pid
    fi
    (lua5.3 worker.lua) &
    echo $! >> /worker.pid
}

restart

while inotifywait -e modify /worker.lua
do
    restart
done

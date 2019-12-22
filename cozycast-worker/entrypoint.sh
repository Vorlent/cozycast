#!/bin/bash
export DISPLAY=":$RANDOM"
sudo chown cozycast:cozycast /home/cozycast

eval $(luarocks path --bin)

function restart {
    if [ -f "/worker.pid" ]; then
        kill -9 $(cat /worker.pid)
        rm /worker.pid
    fi
    (lua worker.lua) &
    echo $! >> /worker.pid
}

restart

while inotifywait -e modify /worker.lua
do
    restart
done

#!/bin/bash
export DISPLAY=":$RANDOM"
sudo chown cozycast:cozycast /home/cozycast

eval $(luarocks path --bin)
lua worker.lua &
sleep 1
sudo -u cozycast xfce4-session

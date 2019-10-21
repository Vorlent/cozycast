#!/bin/bash
export DISPLAY=":99"

Xvfb $DISPLAY -screen 0 1280x720x24 -nolisten tcp &

eval $(luarocks path --bin)
lua worker.lua &

sudo -u cozycast xfce4-session

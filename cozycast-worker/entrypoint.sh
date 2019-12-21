#!/bin/bash
export DISPLAY=":$RANDOM"
sudo chown cozycast:cozycast /home/cozycast

eval $(luarocks path --bin)
lua worker.lua

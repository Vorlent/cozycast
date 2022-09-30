#!/bin/bash

TRIGGER_FILE=/root/cozycast/cozycast-server/src/main/resources/TRIGGER_FILE

for x in $(find npm-website/src/ -type d); do
    echo inotifyd - $(realpath $x):cewDMmynd "|" xargs -I % sh -c "sh dev-trigger.sh"
    (inotifyd - $(realpath $x):cewDMmynd  |  xargs -I % sh -c "echo 'A' >> '$TRIGGER_FILE'") &

done
sleep infinity
#!/bin/bash

TRIGGER_FILE=/root/cozycast/cozycast-server/src/main/resources/TRIGGER_FILE

inotifywait -mrq -e create -e modify -e attrib -e move -e delete --format %w%f npm-website/src/ | while read FILE; do
    echo 'A' >> $TRIGGER_FILE
done

sleep infinity

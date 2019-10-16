#!/bin/bash

#export KURENTO_USERNAME=2139323074:kurento
#export KURENTO_PASSWORD=$(echo -n "$KURENTO_USERNAME" | openssl dgst -sha1 -hmac "$TURN_SECRET" -binary | base64)

echo "turnURL=$KURENTO_USERNAME:$KURENTO_PASSWORD@$EXTERNAL_IP:3478" >> /etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini

exec /usr/bin/kurento-media-server \
  --gst-debug-level=3 \
  --gst-debug="Kurento*:4,kms*:4,kmsremb:3"

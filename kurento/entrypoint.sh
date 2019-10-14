#!/bin/bash
echo "turnURL=kurento:$KURENTO_PASSWORD@$EXTERNAL_IP:3478" >> /etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini
exec /usr/bin/kurento-media-server

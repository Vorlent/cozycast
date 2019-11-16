#!/bin/bash
#!/bin/bash
source ../.env

sudo docker run \
    --rm \
    -it \
    --env TURN_SECRET=$TURN_SECRET \
    --env TURN_IP=$TURN_IP \
    --env KURENTO_IP=$KURENTO_IP \
    --network host \
    -v $(realpath cache/avatar):/tmp/var/cozycast/avatar/ \
    --name cozycast-server cozycast-server


# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

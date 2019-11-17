#!/bin/bash
#!/bin/bash
source ../.env

mkdir -p cache/avatar

sudo docker run \
    --rm \
    -it \
    -v $(realpath cache/avatar):/var/cozycast/avatar/ \
    --env TURN_SECRET=$TURN_SECRET \
    --env TURN_IP=$TURN_IP \
    --env KURENTO_IP=$KURENTO_IP \
    --network host \
    --name cozycast-server cozycast-server


# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

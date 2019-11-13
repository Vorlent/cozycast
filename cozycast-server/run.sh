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
    --name cozycast-server cozycast-server \
    mvn compile exec:java

# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

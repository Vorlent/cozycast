#!/bin/bash
#!/bin/bash
source ../.env
mkdir -p cache
sudo docker run \
    --rm \
    -it \
    --env TURN_SECRET=$TURN_SECRET \
    --env TURN_IP=$TURN_IP \
    --env KURENTO_IP=$KURENTO_IP \
    --env SOURCE_URL=$(git remote get-url origin) \
    --network host \
    -v $(realpath .):/root/cozycast/cozycast-server \
    -v $(realpath cache/.gradle):/root/.gradle/repository \
    -v $(realpath cache/build):/rootcozycast/cozycast-server/build \
    -v $(realpath cache/avatar):/tmp/var/cozycast/avatar/ \
    --name cozycast-server cozycast-server echo "./gradlew run" && sh

# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

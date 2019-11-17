#!/bin/bash
#!/bin/bash
source ../.env

mkdir -p cache/avatar cache/.gradle cache/build

echo "./gradlew run"

sudo docker run \
    --rm \
    -it \
    -v $(realpath .):/root/cozycast/cozycast-server \
    -v $(realpath cache/.gradle):/root/.gradle/repository \
    -v $(realpath cache/build):/root/cozycast/cozycast-server/build \
    -v $(realpath cache/avatar):/var/cozycast/avatar/ \
    --env TURN_SECRET=$TURN_SECRET \
    --env TURN_IP=$TURN_IP \
    --env KURENTO_IP=$KURENTO_IP \
    --env SOURCE_URL=$(git remote get-url origin) \
    --network host \
    --name cozycast-server cozycast-server sh

# Ports required:
# TCP 8443 Webserver
# TCP 8080 Webserver

Clone this repository:

```
git clone https://github.com/Vorlent/cozycast.git
```

Install Docker.

Arch Example:

```
sudo pacman -S docker
sudo systemctl enable docker.socket
sudo systemctl start docker.socket
```

See https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/ for ubuntu instructions.

Test docker installation

```
sudo docker info | grep "Storage Driver"
```

Make sure you have overlay or overlay2 as storage driver. overlay2 usually is the default. (other storage drivers can be buggy, be very careful with those)

Create the .env file:

```
export EXTERNAL_IP=$(curl ifconfig.me)
export TURN_SECRET=<arbitrary_secret_value>
export PRIVATE_IP=<private_ip>

export KURENTO_USERNAME=2139323074:kurento
export KURENTO_PASSWORD=$(echo -n "$KURENTO_USERNAME" | openssl dgst -sha1 -hmac "$TURN_SECRET" -binary | base64)
```

Start coturn

```
cd coturn
./build.sh
./run.sh
```

Start kurento

```
cd kurento
./build.sh
./run.sh
```

Start cozycast-worker

```
cd cozycast-worker
./build.sh
./run.sh
```

Start cozycast-server

```
cd cozycast-server
./build.sh
./run.sh
```

Start cozycast-server for development

```
source .env
cd cozycast-server
./mvnw compile exec:java
```

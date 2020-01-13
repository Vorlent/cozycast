Clone this repository:

```
git clone https://github.com/Vorlent/cozycast.git
```

Install Docker.

Arch Example:

```
sudo pacman -S docker docker-compose
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
export PUBLIC_IP=$(curl ifconfig.me)
export TURN_SECRET=<arbitrary_secret_value>
export PRIVATE_IP=<private_ip>

export TURN_IP=$PUBLIC_IP
export KURENTO_IP=$PRIVATE_IP
export COZYCAST_IP=$PRIVATE_IP

export KURENTO_USERNAME=2139323074:kurento
export KURENTO_PASSWORD=$(echo -n "$KURENTO_USERNAME" | openssl dgst -sha1 -hmac "$TURN_SECRET" -binary | base64)
export SOURCE_URL=<url>

export COZYCAST_DB_HOST=localhost
export COZYCAST_DB_PASS=<db_password>
export COZYCAST_JWT_SECRET=<arbitrary_secret_value>
export COZYCAST_INIT_ADMIN_PASSWORD=<admin_password>

```

If you have made modifications to the source code then it is recommended to set SOURCE_URL to point to the modified source code (e.g. git/github repository or downloadable zip file) to ensure compliance with the AGPL. If you have not made any modifications then you can simply set it to https://github.com/Vorlent/cozycast.

# Start cozycast

```
./cozycast build
./cozycast start
./cozycast stop
```

# Old Method:

Start coturn

```
cd coturn
./run.sh
```

Start kurento

```
cd kurento
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

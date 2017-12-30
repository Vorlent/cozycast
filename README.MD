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

Run
```
./build.sh
```
Run
```
./run.sh
```
and then run
```
mvn compile exec:java
```
inside the container

Run
```
./capture.sh
```

Go to https://localhost:8443/

Enter this URL in the Player:

```
rtsp://localhost:554/abc4
```

Click Play

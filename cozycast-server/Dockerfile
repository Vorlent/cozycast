FROM ubuntu:16.04
ENV REPO="xenial"

RUN apt-get update && apt install -y curl wget nano openjdk-8-jdk maven git

# Install cozycast-server

COPY . /root/cozycast/cozycast-server
WORKDIR /root/cozycast/cozycast-server

WORKDIR /root/cozycast/cozycast-server
CMD /bin/bash #mvn compile exec:java
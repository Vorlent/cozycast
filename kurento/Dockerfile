FROM ubuntu:16.04
ENV REPO="xenial"

# Install Kurento Media Server

RUN apt-get update && apt install -y curl wget nano openjdk-8-jdk maven git
RUN echo "deb http://ubuntu.kurento.org $REPO kms6" | tee /etc/apt/sources.list.d/kurento.list
RUN wget http://ubuntu.kurento.org/kurento.gpg.key -O - | apt-key add -
RUN apt-get update && apt-get install -y kurento-media-server-6.0 kms-datachannelexample
RUN sed -i 's/sudo/#/' /etc/init.d/kurento-media-server-6.0
RUN sed -i 's/ulimit -n/#ulimit -n/' /etc/default/kurento-media-server

# start kurento media server

RUN echo "turnURL=localhost:3478" >> /etc/kurento/modules/kurento/WebRtcEndpoint.conf.ini

USER kurento
CMD ["/usr/bin/kurento-media-server"]

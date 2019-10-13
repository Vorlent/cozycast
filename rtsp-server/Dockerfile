FROM ubuntu:16.04
ENV REPO="xenial"


RUN apt-get update && apt-get install -y curl wget nano git

# Install RTSP Server

RUN apt-get install -y libmoose-perl liburi-perl libmoosex-getopt-perl libsocket6-perl libanyevent-perl make
#RUN echo | cpan
RUN cpan AnyEvent::MPRPC::Client || :
WORKDIR /root/
RUN git clone https://github.com/revmischa/rtsp-server
WORKDIR /root/rtsp-server
RUN perl Makefile.PL
RUN make
RUN make test
RUN make install

# start kurento media server, rtsp server, drop to shell
# you can manually start the webserver with mvn compile exec:java

CMD perl /root/rtsp-server/rtsp-server.pl

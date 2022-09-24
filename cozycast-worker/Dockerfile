FROM ubuntu:18.04
ENV REPO="xenial"

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y ffmpeg xvfb git cmake lua5.3 lua5.3-dev libssl-dev m4 luarocks xdotool pulseaudio \
    firefox libnss3 libcurl3-gnutls sudo xfce4 xfce4-terminal xclip fonts-wqy-microhei inotify-tools vlc && \
    apt-get remove -y xscreensaver lua5.1

ENV UNAME cozycast

RUN export UNAME=$UNAME UID=1000 GID=1000 && \
    mkdir -p "/home/${UNAME}" && \
    echo "${UNAME}:x:${UID}:${GID}:${UNAME} User,,,:/home/${UNAME}:/bin/bash" >> /etc/passwd && \
    echo "${UNAME}:x:${UID}:" >> /etc/group && \
    mkdir -p /etc/sudoers.d

ENV TINI_VERSION="v0.19.0"
ADD https://github.com/krallin/tini/releases/download/v0.19.0/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]
COPY cozycast-worker-1.0-1.rockspec .
COPY vendor /tmp/vendor
RUN cd /tmp/vendor/ravi-ffi/ && mkdir build && cd build \
    && cmake -DUSE_LUA53=ON -DLUA_INCLUDE_DIR=/usr/include/lua5.3/ -DLUA_LIBRARIES=/usr/lib/x86_64-linux-gnu/ .. && make \
    && mkdir -p /usr/local/lib/lua/5.3/ && cp ffi.so /usr/local/lib/lua/5.3/ \
    && cd / && luarocks make
COPY . .

#USER $UNAME
ENV HOME /home/cozycast

CMD ["/entrypoint.sh"]
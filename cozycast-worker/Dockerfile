FROM ubuntu:16.04
ENV REPO="xenial"

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y ffmpeg xvfb lua5.3 libssl-dev m4 luarocks xdotool pulseaudio \
    firefox libnss3 libcurl3-gnutls sudo xfce4 xfce4-terminal xclip fonts-wqy-microhei inotify-tools vlc && \
    apt-get remove -y xscreensaver

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
RUN luarocks install --server=https://luarocks.org/dev luaffi && luarocks make
COPY . .

#USER $UNAME
ENV HOME /home/cozycast

CMD ["/entrypoint.sh"]

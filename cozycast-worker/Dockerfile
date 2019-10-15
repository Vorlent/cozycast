FROM ubuntu:16.04
ENV REPO="xenial"

RUN export DEBIAN_FRONTEND=noninteractive && \
 apt-get update && \
 apt-get install -y ffmpeg xvfb lua5.3 libssl-dev m4 luarocks xdotool pulseaudio firefox sudo xfce4

ENV UNAME cozycast

RUN export UNAME=$UNAME UID=1000 GID=1000 && \
    mkdir -p "/home/${UNAME}" && \
    echo "${UNAME}:x:${UID}:${GID}:${UNAME} User,,,:/home/${UNAME}:/bin/bash" >> /etc/passwd && \
    echo "${UNAME}:x:${UID}:" >> /etc/group && \
    mkdir -p /etc/sudoers.d && \
    echo "${UNAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/${UNAME} && \
    chmod 0440 /etc/sudoers.d/${UNAME} && \
    chown ${UID}:${GID} -R /home/${UNAME} && \
    gpasswd -a ${UNAME} audio

COPY cozycast-worker-1.0-1.rockspec .
RUN luarocks make
COPY . .

USER $UNAME
ENV HOME /home/cozycast

CMD ["/entrypoint.sh"]

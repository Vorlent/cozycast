sudo docker run \
  --rm \
  -it \
  -p 8443:8443 \
  -p 8888:8888 \
  -p 5545:5545 \
  -p 554:554 \
  --network host \
  --name kurento_ubuntu kurento_ubuntu

# Notes:
# Ports required:
# TCP 8443 Webserver
# TCP 8888 Kurento Media Server websocket api
# TCP 5545 RTSP Server port for ffmpeg
# TCP 554 RTSP client port for kurento media server
# UDP ports 49152-65535 inbound to kurento media server
# -p binds a container port to a host port
# --rm deletes the container after running it
# -it runs the container interactively
# -v mounts a directory into the container. RECOMMENDED
# Add this line after -it, change the username:
# -v /home/<insert_linux_username_here>/kurento-ubuntu/:/root \

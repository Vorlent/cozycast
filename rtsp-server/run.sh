#!/bin/bash
sudo docker run \
  --rm \
  -d \
  --network host \
  --name rtsp-server rtsp-server

# TCP 5545 RTSP Server port for ffmpeg
# TCP 554 RTSP client port for kurento media server

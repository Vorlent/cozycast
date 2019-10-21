#!/bin/bash
export DISPLAY=":99"

IP=$1
VIDEO_PORT=$2
AUDIO_PORT=$3

if [ -f "/home/cozycast/ffmpeg.pid" ]; then
    kill -9 $(cat /home/cozycast/ffmpeg.pid)
    rm /home/cozycast/ffmpeg.pid
fi

ffmpeg \
  -thread_queue_size 512 \
  -f alsa \
  -ac 2 \
  -channel_layout stereo \
  -i pulse \
  -s 1280x720 \
  -r 25 \
  -f x11grab \
  -i $DISPLAY.0+0,0 \
  -vsync 1 -async 1 \
  -c:v libvpx \
  -quality realtime \
  -crf 10 \
  -b:v 1M \
  -pix_fmt yuv420p \
  -sdp_file /home/cozycast/sdp_answer \
  -an -f rtp rtp://$IP:$AUDIO_PORT \
  -c:a libopus \
  -b:a 192k \
  -vn -sdp_file /home/cozycast/sdp_answer -f rtp rtp://$IP:$VIDEO_PORT &

FFMPEG_PID=$!
echo "$FFMPEG_PID" >> /home/cozycast/ffmpeg.pid

# Notes:
# -f alsa -ac 2 -i pulse
# records output of the soundcard
# -s specifies the resolution
# -r specifices the framerate
# -f x11grab -i :0.0+0,0 records the screen at position x:0, y:0 (top left corner)
# -b:v sets bitrate
# -c:a sets audio codec
# -b:a sets audio bitrate
# -f rtsp specifies RTSP server

#!/bin/bash
OPTIONS=${@:1}

echo ffmpeg $OPTIONS

if [ -f "/home/cozycast/ffmpeg.pid" ]; then
    kill -9 $(cat /home/cozycast/ffmpeg.pid)
    rm /home/cozycast/ffmpeg.pid
fi

sudo -u cozycast ffmpeg $OPTIONS &

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

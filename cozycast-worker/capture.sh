export DISPLAY=":99"

Xvfb $DISPLAY -screen 0 1280x720x24 -nolisten tcp &

eval $(luarocks path --bin)
lua worker.lua &

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
  -b:v 2M \
  -pix_fmt yuv420p \
  -c:a libopus \
  -b:a 192k \
  -f rtsp rtsp://localhost:5545/abc4 &

xfce4-session

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

pactl load-module module-null-sink sink_name=cozycast-sink

pactl list sink-inputs

# 77 is the sink-input id of the chromium process
pactl move-sink-input 77 cozycast-sink

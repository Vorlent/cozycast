local websocket = require "http.websocket"
local lunajson = require 'lunajson'

local mouse_web_to_xdo = {
    [0] = 1,
    [1] = 2,
    [2] = 3,
}

local keyboard_web_to_xdo = {
    [" "] = "space",
    ["€"] = "EuroSign",
    ["°"] = "degree",
    ["µ"] = "mu",
    ["ß"] = "ssharp",
    ["-"] = "minus",
    ["+"] = "plus",
    ["."] = "period",
    [":"] = "colon",
    ["|"] = "bar",
    ["/"] = "slash",
    ["\\"] = "backslash",
    [";"] = "semicolon",
    ["$"] = "dollar",
    ["#"] = "numbersign",
    ["!"] = "exclam",
    ["%"] = "percent",
    ["&"] = "ampersand",
    ["\""] = "quotedbl",
    ["'"] = "apostrophe",
    ["("] = "parenleft",
    [")"] = "parenright",
    ["*"] = "asterisk",
    [","] = "comma",
    ["<"] = "less",
    ["="] = "equal",
    [">"] = "greater",
    ["?"] = "question",
    ["@"] = "at",
    ["["] = "bracketleft",
    ["]"] = "bracketright",
    ["^"] = "dead_circumflex",
    ["_"] = "underscore",
    ["`"] = "dead_grave",
    ["´"] = "dead_acute",
    ["{"] = "braceleft",
    ["}"] = "braceright",
    ["~"] = "asciitilde",
    ["PageUp"] = "Prior",
    ["PageDown"] = "Next",
    ["Enter"] = "KP_Enter",
    ["Escape"] = "Escape",
    ["ArrowLeft"] = "Left",
    ["ArrowRight"] = "Right",
    ["ArrowUp"] = "Up",
    ["ArrowDown"] = "Down",
    ["Backspace"] = "BackSpace",
}

local pressed_keys = {}

function wait_for_pulseaudio()
    while true do
        local pgrep = io.popen('pgrep "pulseaudio" -c', 'r')
        local stdout = pgrep:read("*a")
        local count = tonumber(stdout)
        if count ~= 0 then
            return true
        end
        pgrep:close()
        os.execute("sleep 1")
    end
end

local video_settings = {
    desktop_width = 1280,
    desktop_height =  720,
    scale_width = 1280,
    scale_height =  720,
    frame_rate = 25,
    video_bitrate = "1M",
    audio_bitrate = "192k"
}

function capture(data, ws)
    wait_for_pulseaudio()

    local scale = ""
    if video_settings.scale_width ~= video_settings.desktop_width
        and video_settings.scale_height ~= video_settings.desktop_height then
        scale = "-vf scale="..video_settings.scale_width..":"..video_settings.scale_height
    end
    local options = {
        "-thread_queue_size 512",
        "-f alsa",
        "-ac 2",
        "-channel_layout stereo",
        "-i pulse",
        "-s "..video_settings.desktop_width.."x"..video_settings.desktop_height,
        "-framerate "..video_settings.frame_rate,
        "-f x11grab",
        "-i $DISPLAY.0+0,0",
        "-c:v libvpx",
        "-quality realtime",
        scale,
        "-crf 10",
        "-b:v "..video_settings.video_bitrate,
        "-pix_fmt yuv420p",
        "-sdp_file /home/cozycast/sdp_answer",
        "-an -f rtp rtp://"..data.ip..":"..data.audioPort,
        "-c:a libopus",
        "-af aresample=async=1000:first_pts=0",
        "-b:a "..video_settings.audio_bitrate,
        "-vn -sdp_file /home/cozycast/sdp_answer",
        "-f rtp rtp://"..data.ip..":"..data.videoPort
    }

    local options_string = ""
    for i = 1, #options do
      options_string = options_string.." "..options[i]
    end

    print ("/capture.sh "..options_string)
    os.execute ("/capture.sh "..options_string)
    repeat
        local file, error = io.open("/home/cozycast/sdp_answer", "rb")
        if file then
            local content = file:read "*a"
            print (content);
            print(lunajson.encode{
                action = "sdpAnswer",
                content = content
            })
            ws:send(lunajson.encode{
                action = "sdpAnswer",
                content = content
            })
            file:close()
        else
            print(error)
            os.execute("sleep 1")
        end
    until file
end

local last_keepalive = 0

function keepalive(ws)
    ws:send(lunajson.encode{
        action = "keepalive"
    })
end

local worker = {}

function worker.get_active_window_title()
    local xprop = io.popen('xprop -id $(xprop -root _NET_ACTIVE_WINDOW | grep -oiP \"0x.{7}\") WM_NAME | sed \"s/WM_NAME(STRING) = //\"', 'r')
    local stdout = xprop:read("*a")
    xprop:close()
    return stdout
end

function worker.mouse_move(mouseX, mouseY)
    if mouseX and mouseY
        and mouseX ~= 0
        and mouseY ~= 0
        and mouseX >= 0
        and mouseY >= 0 then
        os.execute ("xdotool mousemove "..mouseX.." "..mouseY)
    end
end

function worker.mouse_up(mouseX, mouseY, button)
    worker.mouse_move(mouseX, mouseY)
    local xdo_button = (mouse_web_to_xdo[button])
    if xdo_button then
        os.execute ("xdotool mouseup "..xdo_button)
    end
end

function worker.mouse_down(mouseX, mouseY, button)
    worker.mouse_move(mouseX, mouseY)
    local xdo_button = (mouse_web_to_xdo[button])
    if xdo_button then
        os.execute ("xdotool mousedown "..xdo_button)
    end
end

function worker.clipboard_write(text)
    local xdotool = io.popen("xclip -selection clipboard", 'w')
    xdotool:write(text or "")
    xdotool:close()
    os.execute ("xdotool key ctrl+v")
end

function worker.key_up(key)
    key = keyboard_web_to_xdo[key] or key
    pressed_keys[key] = nil
    if key then
        os.execute ("xdotool keyup "..key)
    end
end

function worker.key_down(key)
    key = keyboard_web_to_xdo[key] or key
    pressed_keys[key] = true
    if key then
        os.execute ("xdotool keydown "..key)
    end
end

function worker.keyboard_reset(key)
    for key, pressed in pairs(pressed_keys) do
        if key then
            os.execute ("xdotool keyup "..key)
            pressed_keys[key] = nil
        end
    end
end

function worker.scroll_up()
    os.execute ("xdotool click 4")
end

function worker.scroll_down()
    os.execute ("xdotool click 5")
end

function onmessage(ws, data)
    if data.type == "sdpOffer" then
        print("sdpOffer")
        capture(data, ws)
        return true
    end
    if data.action == "mousemove" then
        worker.mouse_move(data.mouseX, data.mouseY)
        return true
    end
    if data.action == "mouseup" then
        worker.mouse_up(data.mouseX, data.mouseY, data.button)
        return true
    end
    if data.action == "mousedown" then
        worker.mouse_down(data.mouseX, data.mouseY, data.button)
        return true
    end

    if data.action == "paste" then
        worker.clipboard_write(data.clipboard)
        return true
    end
    if data.action == "keyup" then
        worker.key_up(data.key)
        return true
    end
    if data.action == "keydown" then
        worker.key_down(data.key)
        return true
    end
    if data.action == "reset_keyboard" then
        worker.keyboard_reset()
        return true
    end
    if data.action == "scroll" then
        if data.direction == "up" then
            worker.scroll_up()
        end
        if data.direction == "down" then
            worker.scroll_down()
        end
        return true
    end
    if data.action == "worker_restart" then
        print "Worker restart requested..."
        ws:close()
        return true
    end
    if data.action == "worker_update_settings" then
        print "Updating video settings and restarting worker..."

        video_settings.scale_width = data.settings.scaleWidth
        video_settings.scale_height = data.settings.scaleHeight
        video_settings.desktop_width = data.settings.desktopWidth
        video_settings.desktop_height = data.settings.desktopHeight
        video_settings.frame_rate = data.settings.framerate
        video_settings.video_bitrate = data.settings.videoBitrate
        video_settings.audio_bitrate = data.settings.audioBitrate
        if data.restart then
            ws:close()
        end
        return true
    end
    if data.action == "keepalive" then
        -- skip keepalive response
        return true
    end
    return false
end

function start_server()
    local server = os.getenv("COZYCAST_IP")
    if os.getenv("DUCKDNS_DOMAIN") ~= "" then
        server = os.getenv("DUCKDNS_DOMAIN")
    end
    local room = os.getenv("COZYCAST_ROOM") or "default"
    local url = "ws://"..server.."/worker/"..room
    if os.getenv("FORCE_HTTPS") == "true" then
        url = "wss://"..server..":8443/worker/"..room
    end
    print(url)
    local ws = websocket.new_from_uri(url)
    ws:connect()

    io.stdout:flush()

    while true do
        local msg, error, errno = ws:receive(5)
        if errno == 107 or errno == 32 or (not msg and not error and not errno) then
            print("Could not connect to "..url)
            return
        end
        if errno == 110 then -- timeout
            keepalive(ws)
            ws:send(lunajson.encode{
                action = "window_title",
                title = worker.get_active_window_title()
            })
        else
            status, error = pcall(function()
                if error == "text" then
                    local data = lunajson.decode(msg)
                    if not onmessage(ws, data) then
                        print("Unknown message: "..msg)
                        print(error)
                        print(errno)
                    end
                end
            end)
            if not status then
                print(error)
            end
        end
        if last_keepalive < os.time() - 10 then
            keepalive(ws)
            last_keepalive = os.time()
        end
        io.stdout:flush()
    end

    ws:close()
end
os.execute ("Xvfb $DISPLAY -screen 0 "..video_settings.desktop_width.."x"..video_settings.desktop_height.."x24 -nolisten tcp & echo $! >> /worker.pid")
os.execute ("sudo -u cozycast xfce4-session & echo $! >> /worker.pid")
while true do
    print(pcall(start_server))
    print("Restarting lua worker in 5 seconds")
    os.execute("sleep 5")
end

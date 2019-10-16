local websocket = require "http.websocket"
local lunajson = require 'lunajson'

local mouse_web_to_xdo = {
  [0] = 1,
  [1] = 2,
  [2] = 3,
}

local keyboard_web_to_xdo = {
  [" "] = "space",
  ["-"] = "minus",
  ["+"] = "plus",
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

function capture(data, ws)
    print ("/capture.sh "..data.ip.." "..data.videoPort.." "..data.audioPort)
    os.execute ("/capture.sh "..data.ip.." "..data.videoPort.." "..data.audioPort)
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


function start_server()
    local ws = websocket.new_from_uri("ws://localhost:8080/stream")
    ws:connect()
    ws:send(lunajson.encode{ action = "worker"})
    while true do
      local msg = ws:receive()
      local data = lunajson.decode(msg)
      if data.type == "sdpOffer" then
        capture(data, ws)
      end
      if data.action == "mousemove" then
        print ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
        os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
      end
      if data.action == "mouseup" then
        print ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
        os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
        print ("xdotool mouseup "..(mouse_web_to_xdo[data.button]))
        os.execute ("xdotool mouseup "..(mouse_web_to_xdo[data.button]))
      end
      if data.action == "mousedown" then
        print ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
        os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
        print ("xdotool mousedown "..(mouse_web_to_xdo[data.button]))
        os.execute ("xdotool mousedown "..(mouse_web_to_xdo[data.button]))
      end

      if data.action == "keyup" then
        data.key = keyboard_web_to_xdo[data.key] or data.key
        print ("xdotool keyup "..data.key)
        os.execute ("xdotool keyup "..data.key)
      end
      if data.action == "keydown" then
        data.key = keyboard_web_to_xdo[data.key] or data.key
        print ("xdotool keydown "..data.key)
        os.execute ("xdotool keydown "..data.key)
      end
      if data.action == "scroll" then
        if data.direction == "up" then
          print ("xdotool click 4")
          os.execute ("xdotool click 4")
        end
        if data.direction == "down" then
          print ("xdotool click 5")
          os.execute ("xdotool click 5")
        end
      end
    end

    ws:close()
end

while true do
    print(pcall(start_server))
    print("Restarting lua worker in 5 seconds")
    os.execute("sleep 5")
end

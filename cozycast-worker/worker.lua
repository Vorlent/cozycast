local websocket = require "http.websocket"
local lunajson = require 'lunajson'

local mouse_web_to_xdo = {
  [0] = 1,
  [1] = 2,
  [2] = 3,
}

local keyboard_web_to_xdo = {
  [" "] = "space",
  ["Enter"] = "KP_Enter",
  ["Escape"] = "Escape",
  ["ArrowLeft"] = "Left",
  ["ArrowRight"] = "Right",
  ["ArrowUp"] = "Up",
  ["ArrowDown"] = "Down",
  ["Backspace"] = "BackSpace",
}

local ws = websocket.new_from_uri("ws://localhost:8080/stream")
ws:connect()
ws:send(lunajson.encode{ action = "worker"})
while true do
  local msg = ws:receive()
  local data = lunajson.decode(msg)
  if data.action == "mousemove" then
    os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
  end
  if data.action == "mouseup" then
    os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
    os.execute ("xdotool mouseup "..(mouse_web_to_xdo[data.button]))
  end
  if data.action == "mousedown" then
    os.execute ("xdotool mousemove "..data.mouseX.." "..data.mouseY)
    os.execute ("xdotool mousedown "..(mouse_web_to_xdo[data.button]))
  end

  if data.action == "keyup" then
    data.key = keyboard_web_to_xdo[data.key] or data.key
    os.execute ("xdotool keyup "..data.key)
  end
  if data.action == "keydown" then
    data.key = keyboard_web_to_xdo[data.key] or data.key
    os.execute ("xdotool keydown "..data.key)
  end
  if data.action == "scroll" then
    print(data)
    if data.direction == "up" then
      os.execute ("xdotool click 4")
    end
    if data.direction == "down" then
      os.execute ("xdotool click 5")
    end
  end
end

ws:close()

package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketBroadcaster
import io.micronaut.websocket.annotation.OnClose
import io.micronaut.websocket.annotation.OnMessage
import io.micronaut.websocket.annotation.OnOpen
import io.micronaut.websocket.annotation.ServerWebSocket
import io.micronaut.websocket.WebSocketSession

import java.io.IOException;
import java.util.Map;
import java.util.List;
import com.google.gson.Gson;
import java.util.concurrent.CopyOnWriteArrayList;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import org.kurento.client.EndOfStreamEvent;
import org.kurento.client.ErrorEvent;
import org.kurento.client.EventListener;
import org.kurento.client.IceCandidate;
import org.kurento.client.IceCandidateFoundEvent;
import org.kurento.client.KurentoClient;
import org.kurento.client.MediaPipeline;
import org.kurento.client.MediaState;
import org.kurento.client.MediaStateChangedEvent;
import org.kurento.client.RtpEndpoint;
import org.kurento.client.VideoInfo;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.commons.exception.KurentoException;
import org.kurento.jsonrpc.JsonUtils;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import java.util.TimeZone;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

import groovy.util.logging.Slf4j

class StartResponse {
    String action = "startResponse"
    String sdpAnswer
}

class IceCandidateEvent {
    String action = "iceCandidate"
    Map candidate
}

class TypingEvent {
    String action = "typing"
    String session
    String state
    String username
}

class ReceiveMessageEvent {
    String action = "receivemessage"
    String message
    String username
    String timestamp
}

class ChangeUsernameEvent {
    String action = "changeusername"
    String session
    String username
}

class ChangeProfilePictureEvent {
    String action = "changeprofilepicture"
    String session
    String url
}


class KeyUpEvent {
    String action = "keyup"
    String key
}

class KeyDownEvent {
    String action = "keydown"
    String key
}

class MouseMoveEvent {
    String action = "mousemove"
    Double mouseX
    Double mouseY
}

class MouseUpEvent {
    String action = "mouseup"
    Double mouseX
    Double mouseY
    Long button
}

class MouseDownEvent {
    String action = "mousedown"
    Double mouseX
    Double mouseY
    Long button
}

class PickupRemoteEvent {
    String action = "pickup_remote"
    String session
    Boolean has_remote
}

class DropRemoteEvent {
    String action = "drop_remote"
    String session
}

class ResetKeyboardEvent {
    String action = "reset_keyboard"
}

class LeaveEvent {
    String action = "leave"
    String username
    String session
}

class CozycastError {
    String action = "error"
    String message
}

class PlayEndEvent {
    String action = "playEnd"
}

class JoinEvent {
    String action = "join"
    String session
    String username
    String url
}

class PasteEvent {
    String action = "paste"
    String clipboard
}

class ScrollEvent {
    String action = "scroll"
    String direction
}

class KeepAlive {
    String action = "keepalive"
}

@Slf4j
@ServerWebSocket("/player/{room}")
class PlayerWebsocketServer {

    private KurentoClient kurento
    private WebSocketBroadcaster broadcaster
    private RoomRegistry roomRegistry

    PlayerWebsocketServer(WebSocketBroadcaster broadcaster, KurentoClient kurento,
        RoomRegistry roomRegistry) {
        this.broadcaster = broadcaster
        this.kurento = kurento
        this.roomRegistry = roomRegistry
    }

    private void keepalive(Room room, WebSocketSession session, Map jsonMessage) {
        session.sendSync(new KeepAlive())
    }

    private void start(Room room, WebSocketSession session, Map jsonMessage) {
        final UserSession user = room.users.get(session.getId())
        user?.release()

        if(!room.worker) {
            throw new RuntimeException("NO WORKER FOUND")
        }

        MediaPipeline pipeline = room.worker.getMediaPipeline(kurento)
        WebRtcEndpoint webRtcEndpoint = new WebRtcEndpoint.Builder(pipeline).build()
        user.webRtcEndpoint = webRtcEndpoint

        room.worker.rtpEndpoint.connect(webRtcEndpoint)

        webRtcEndpoint.addIceCandidateFoundListener(new EventListener<IceCandidateFoundEvent>() {
            public void onEvent(IceCandidateFoundEvent event) {
                session.sendSync(new IceCandidateEvent(
                    candidate: [
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    ]))
            }
        })

        String sdpOffer = jsonMessage.sdpOffer;
        String sdpAnswer = webRtcEndpoint.processOffer(sdpOffer)

        session.sendSync(new StartResponse(sdpAnswer: sdpAnswer))

        webRtcEndpoint.gatherCandidates()
    }

    private void typing(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        room.users.each { key, value ->
            if(session.getId() != value.getWebSocketSession().getId()) {
                value.getWebSocketSession().sendSync(new TypingEvent(
                    session: session.getId(),
                    state: jsonMessage.state,
                    username: jsonMessage.username
                ))
            }
        }
    }

    private void chatmessage(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        TimeZone tz = TimeZone.getTimeZone("UTC")
        DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm'Z'")
        df.setTimeZone(tz)
        String nowAsISO = df.format(new Date())
        room.users.each { key, value ->
            value.webSocketSession.sendSync(new ReceiveMessageEvent(
                message: jsonMessage.message,
                username: jsonMessage.username,
                timestamp: nowAsISO
            ))
        }
    }

    private void changeusername(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        UserSession user = room.users.get(session.getId())
        user.username = jsonMessage.username
        room.users.each { key, value ->
            value.webSocketSession.sendSync(new ChangeUsernameEvent(
                session: session.getId(),
                username: jsonMessage.username
            ))
        }
    }

    private void changeprofilepicture(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        UserSession user = room.users.get(session.getId())
        user.avatarUrl = jsonMessage.url
        room.users.each { key, value ->
            value.webSocketSession.sendSync(new ChangeProfilePictureEvent(
                session: session.getId(),
                url: jsonMessage.url
            ))
        }
    }

    private void join(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        UserSession user = room.users.get(session.getId())
        user.username = jsonMessage.username
        if(jsonMessage.url) {
            user.avatarUrl = jsonMessage.url
        }

        room.users.each { key, value ->
            // send existing users to new user
            if(value.getWebSocketSession() != session) {
                value.webSocketSession.sendSync(new JoinEvent(
                    session: session.getId(),
                    username: jsonMessage.username,
                    url: jsonMessage.url
                ))
            }

            // send new user to existing users
            if (value.getUsername() != null) {
                session.sendSync(new JoinEvent(
                    session: key,
                    username: value.getUsername(),
                    url: value.getAvatarUrl()
                ))
            }
        }
    }

    private void scroll(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            log.info jsonMessage.toString()
            room.worker?.websocket?.sendSync(new ScrollEvent(direction: jsonMessage.direction))
        }
    }

    private void paste(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            log.info jsonMessage.toString()
            room.worker?.websocket?.sendSync(new PasteEvent(clipboard: jsonMessage.clipboard))
        }
    }

    private void keyup(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            log.info jsonMessage.toString()
            room.worker?.websocket?.sendSync(new KeyUpEvent(key: jsonMessage.key))
        }
    }

    private void keydown(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            room.worker?.websocket?.sendSync(new KeyDownEvent(key: jsonMessage.key))
        }
    }

    private void mousemove(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        if(session.getId() == room.remote) {
            room.worker?.websocket?.sendSync(new MouseMoveEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY))
        }
    }

    private void mouseup(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        if(session.getId() == room.remote) {
            room.worker?.websocket?.sendSync(new MouseUpEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY,
                button: jsonMessage.button))
        }
    }

    private void mousedown(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        if(session.getId() == room.remote) {
            room.worker?.websocket?.sendSync(new MouseDownEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY,
                button: jsonMessage.button))
        }
    }

    private void pickupremote(Room room, WebSocketSession session) {
        room.remote = session.getId()
        room.users.each { key, value ->
            value.webSocketSession.sendSync(new PickupRemoteEvent(
                session: session.getId(),
                has_remote: value.webSocketSession.getId() == session.getId()))
        }
        room.worker?.websocket?.sendSync(new ResetKeyboardEvent())
    }

    private void dropremote(Room room, WebSocketSession session) {
        room.remote = null
        room.users.each { key, value ->
            value.webSocketSession.sendSync(new DropRemoteEvent(
                session: session.getId()
            ))
        }
    }

    private void stop(Room room, String sessionId) {
        UserSession user = room.users.remove(sessionId)
        room.users.each { key, value ->
            if (value.username != null) {
                value.webSocketSession.sendSync(new LeaveEvent(
                    session: sessionId,
                    username: value.username
                ))
            }
        }
        user?.release()
    }

    private void onIceCandidate(Room room, String sessionId, Map jsonMessage) {
        UserSession user = room.users.get(sessionId)

        if (user != null) {
            Map jsonCandidate = jsonMessage.candidate;
            log.info jsonCandidate.toString()
            IceCandidate candidate = new IceCandidate(
                jsonCandidate.candidate,
                jsonCandidate.sdpMid,
                jsonCandidate.sdpMLineIndex)
            user.webRtcEndpoint?.addIceCandidate(candidate)
        }
    }

    public void sendPlayEnd(Room room, WebSocketSession session) {
        if (room.users.containsKey(session.getId())) {
            session.sendSync(new PlayEndEvent())
        }
    }

    private void sendError(WebSocketSession session, String message) {
        session.sendSync(new CozycastError(message: message))
    }

    @OnOpen
    void onOpen(String room, WebSocketSession session) {
        roomRegistry.getRoom(room).users.put(session.getId(), new UserSession(
                webSocketSession: session,
                username: "Anonymous",
                avatarUrl: "https://pepethefrog.ucoz.com/_nw/2/89605944.jpg"
            ))
    }

    @OnMessage
    void onMessage(WebSocketSession session, String room, Map jsonMessage) {
        String sessionId = session.getId()
        Room currentRoom = roomRegistry.getRoom(room)

        try {
            switch (jsonMessage.action) {
                case "keepalive":
                    keepalive(currentRoom, session, jsonMessage)
                    break;
                case "start":
                    start(currentRoom, session, jsonMessage)
                    break;
                case "stop":
                    stop(currentRoom, sessionId)
                    break;
                case "typing":
                    typing(currentRoom, session, jsonMessage)
                    break;
                case "chatmessage":
                    chatmessage(currentRoom, session, jsonMessage)
                    break;
                case "changeusername":
                    changeusername(currentRoom, session, jsonMessage)
                    break;
                case "changeprofilepicture":
                    changeprofilepicture(currentRoom, session, jsonMessage)
                    break;
                case "join":
                    join(currentRoom, session, jsonMessage)
                    break;
                case "scroll":
                    scroll(currentRoom, session, jsonMessage)
                    break;
                case "mousemove":
                    mousemove(currentRoom, session, jsonMessage)
                    break;
                case "mouseup":
                    mouseup(currentRoom, session, jsonMessage)
                    break;
                case "mousedown":
                    mousedown(currentRoom, session, jsonMessage)
                    break;
                case "paste":
                    paste(currentRoom, session, jsonMessage)
                    break;
                case "keyup":
                    keyup(currentRoom, session, jsonMessage)
                    break;
                case "keydown":
                    keydown(currentRoom, session, jsonMessage)
                    break;
                case "pickup_remote":
                    pickupremote(currentRoom, session)
                    break;
                case "drop_remote":
                    dropremote(currentRoom, session)
                    break;
                case "onIceCandidate":
                    onIceCandidate(currentRoom, sessionId, jsonMessage)
                    break;
                default:
                    sendError(session, "Invalid message with action " + jsonMessage.action)
                    break;
            }
        } catch (Throwable t) {
            t.printStackTrace()
            sendError(session, t.getMessage())
        }
    }

    @OnClose
    void onClose(String room, WebSocketSession session) {
        stop(roomRegistry.getRoom(room), session.getId())
    }
}

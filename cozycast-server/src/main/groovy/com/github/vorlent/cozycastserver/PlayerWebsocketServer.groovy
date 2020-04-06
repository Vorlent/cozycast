package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketBroadcaster
import io.micronaut.websocket.annotation.OnClose
import io.micronaut.websocket.annotation.OnMessage
import io.micronaut.websocket.annotation.OnOpen
import io.micronaut.websocket.annotation.ServerWebSocket
import io.micronaut.websocket.WebSocketSession
import io.micronaut.websocket.CloseReason
import io.micronaut.security.token.jwt.validator.JwtTokenValidator

import io.reactivex.Flowable
import io.reactivex.schedulers.Schedulers
import com.github.vorlent.cozycastserver.domain.ChatMessage

import java.time.format.DateTimeFormatter
import java.time.ZonedDateTime
import java.time.ZoneId
import java.io.IOException
import java.util.Map
import java.util.List
import com.google.gson.Gson
import java.util.concurrent.CopyOnWriteArrayList

import java.io.IOException
import java.util.concurrent.ConcurrentHashMap

import org.kurento.client.EndOfStreamEvent
import org.kurento.client.ErrorEvent
import org.kurento.client.EventListener
import org.kurento.client.IceCandidate
import org.kurento.client.IceCandidateFoundEvent
import org.kurento.client.KurentoClient
import org.kurento.client.MediaPipeline
import org.kurento.client.MediaState
import org.kurento.client.MediaStateChangedEvent
import org.kurento.client.RtpEndpoint
import org.kurento.client.VideoInfo
import org.kurento.client.WebRtcEndpoint
import org.kurento.commons.exception.KurentoException
import org.kurento.jsonrpc.JsonUtils
import java.util.regex.Pattern
import java.util.regex.Matcher

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonObject
import java.util.TimeZone
import java.text.DateFormat
import java.text.SimpleDateFormat
import java.util.Date

import groovy.util.logging.Slf4j

class StartResponse {
    String action = "startResponse"
    String sdpAnswer
    VideoSettings videoSettings
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
    Long lastTypingTime
}

class ChatHistoryEvent {
    String action = "chat_history"
    List<ReceiveMessageEvent> messages
}

class ReceiveMessageEvent {
    String action = "receivemessage"
    String message
    String image
    String type
    String username
    String session
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

class SessonIdEvent {
    String action = "session_id"
    String session
}

class KickEvent {
    String action = "kick"
    String session
}

class RestartWorkerEvent {
    String action = "worker_restart"
}

@Slf4j
@ServerWebSocket("/player/{room}")
class PlayerWebsocketServer {

    private KurentoClient kurento
    private WebSocketBroadcaster broadcaster
    private RoomRegistry roomRegistry
    private JwtTokenValidator jwtTokenValidator

    PlayerWebsocketServer(WebSocketBroadcaster broadcaster, KurentoClient kurento,
        RoomRegistry roomRegistry, JwtTokenValidator jwtTokenValidator) {
        this.broadcaster = broadcaster
        this.kurento = kurento
        this.roomRegistry = roomRegistry
        this.jwtTokenValidator = jwtTokenValidator
    }

    private void keepalive(Room room, WebSocketSession session, Map jsonMessage) {
        sendMessage(session, new KeepAlive())
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
                sendMessage(session, new IceCandidateEvent(
                    candidate: [
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    ]))
            }
        })

        String sdpOffer = jsonMessage.sdpOffer;
        String sdpAnswer = webRtcEndpoint.processOffer(sdpOffer)

        sendMessage(session, new StartResponse(sdpAnswer: sdpAnswer, videoSettings: room.worker.videoSettings))

        webRtcEndpoint.gatherCandidates()
    }

    private void typing(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        final UserSession user = room.users.get(session.getId())
        room.users.each { key, value ->
            if(session.getId() != value.getWebSocketSession().getId()) {
                sendMessage(value.webSocketSession, new TypingEvent(
                    session: session.getId(),
                    state: jsonMessage.state,
                    username: jsonMessage.username,
                    lastTypingTime: new Date().getTime()
                ))
            }
        }
    }

    private void chatmessage(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        ZonedDateTime zonedDateTime = ZonedDateTime.now(ZoneId.of("UTC"))
        String nowAsISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(zonedDateTime)
        ChatMessage.withTransaction {
            ChatMessage.where { room == room.name &&
                timestamp < ZonedDateTime.now(ZoneId.of("UTC")).minusHours(1)
            }.list().each { it.delete() }
            def chatMessage = new ChatMessage(
                room: room.name,
                message: jsonMessage.message,
                image: jsonMessage.image,
                type: jsonMessage.type,
                username: jsonMessage.username,
                timestamp: zonedDateTime
            )
            if(chatMessage.validate()) {
                chatMessage.save()
            } else {
                log.warn "Chat message by user ${jsonMessage.username} in room ${room.name} is too long: ${jsonMessage.message?.substring(0, 4096)}"
                return
            }
            room.users.each { key, value ->
                sendMessage(value.webSocketSession, new ReceiveMessageEvent(
                    message: jsonMessage.message,
                    image: jsonMessage.image,
                    type: jsonMessage.type,
                    username: jsonMessage.username,
                    session: session.getId(),
                    timestamp: nowAsISO
                ))
            }
        }
    }

    private void changeusername(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        if(!(jsonMessage.username instanceof String)) {
            log.warn "Username ${jsonMessage.username} of type ${${jsonMessage.username?.class}} is not a string."
            return;
        }
        if(jsonMessage.username.length() > 12) {
            log.warn "Username ${jsonMessage.username} is longer than 12 characters."
            return;
        }
        UserSession user = room.users.get(session.getId())
        user.username = jsonMessage.username
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new ChangeUsernameEvent(
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
            sendMessage(value.webSocketSession, new ChangeProfilePictureEvent(
                session: session.getId(),
                url: jsonMessage.url
            ))
        }
    }

    private void join(Room room, WebSocketSession session, Map jsonMessage) {
        def token = jsonMessage.token
        if(room.inviteOnly) {
            if(token && jwtTokenValidator.validate(token)) {
                //success
            } else {
                session.close()
            }
        }
        UserSession user = room.users.get(session.getId())
        user.username = jsonMessage.username
        if(jsonMessage.url) {
            user.avatarUrl = jsonMessage.url
        }
        sendMessage(session, new SessonIdEvent(
            session: session.getId()
        ))
        sendMessage(session, new WindowTitleEvent(
            title: "CozyCast: " + (room.title ?: "Low latency screen capture via WebRTC")
        ))

        ChatMessage.withTransaction {
            sendMessage(session, new ChatHistoryEvent(
                messages: ChatMessage.where { room == room.name &&
                        timestamp > ZonedDateTime.now(ZoneId.of("UTC")).minusHours(1)
                    }.list(sort: "timestamp", order: "asc", max: 500).collect {
                    new ReceiveMessageEvent(
                        message: it.message,
                        image: it.image,
                        type: it.type,
                        username: it.username,
                        session: null,
                        timestamp: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'")
                            .format(it.timestamp)
                    )
                }
            ))
        }

        room.users.each { key, value ->
            // send existing users to new user
            if(value.getWebSocketSession() != session) {
                sendMessage(value.webSocketSession, new JoinEvent(
                    session: session.getId(),
                    username: jsonMessage.username,
                    url: jsonMessage.url
                ))
            }

            // send new user to existing users
            if (value.getUsername() != null) {
                sendMessage(session, new JoinEvent(
                    session: key,
                    username: value.getUsername(),
                    url: value.getAvatarUrl()
                ))
            }
        }
    }

    private void scroll(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new ScrollEvent(direction: jsonMessage.direction))
        }
    }

    private void paste(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            log.info jsonMessage.toString()
            sendMessage(room.worker?.websocket, new PasteEvent(clipboard: jsonMessage.clipboard))
        }
    }

    private void keyup(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new KeyUpEvent(key: jsonMessage.key))
        }
    }

    private void keydown(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new KeyDownEvent(key: jsonMessage.key))
        }
    }

    private void mousemove(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new MouseMoveEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY))
        }
    }

    private void mouseup(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new MouseUpEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY,
                button: jsonMessage.button))
        }
    }

    private void mousedown(Room room, WebSocketSession session, Map jsonMessage) {
        if(session.getId() == room.remote) {
            sendMessage(room.worker?.websocket, new MouseDownEvent(
                mouseX: jsonMessage.mouseX,
                mouseY: jsonMessage.mouseY,
                button: jsonMessage.button))
        }
    }

    private void pickupremote(Room room, WebSocketSession session) {
        room.remote = session.getId()
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new PickupRemoteEvent(
                session: session.getId(),
                has_remote: value.webSocketSession.getId() == session.getId()))
        }
        sendMessage(room.worker?.websocket, new ResetKeyboardEvent())
    }

    private void dropremote(Room room, WebSocketSession session) {
        room.remote = null
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new DropRemoteEvent(
                session: session.getId()
            ))
        }
    }

    private void restartWorker(Room room, WebSocketSession session, Map jsonMessage) {
        def token = jsonMessage.token
        if(token && jwtTokenValidator.validate(token)) {
            sendMessage(room.worker?.websocket, new RestartWorkerEvent())
        }
    }

    private void saveRoomSettings(Room room, WebSocketSession session, Map jsonMessage) {
        def token = jsonMessage.token
        if(token && jwtTokenValidator.validate(token)) {
            if(jsonMessage.accessType) {
                if(jsonMessage.accessType == "public") {
                    room.inviteOnly = false
                }
                if(jsonMessage.accessType == "authenticated") {
                    room.inviteOnly = true
                }
                if(jsonMessage.accessType == "invite") {
                    room.inviteOnly = true
                }
            }

            if(jsonMessage.resolution) {
                def resolutions = [
                    "1080": [ width: 1080, height: 1920 ],
                    "720": [ width: 720, height: 1280 ],
                    "480": [ width: 480, height: 640 ],
                    "240": [ width: 240, height: 320 ],
                    "144": [ width: 144, height: 256 ]
                ]
                def res = resolutions[jsonMessage.resolution.toString()]
                if(res) {
                    room.videoSettings.width = res.width
                    room.videoSettings.height = res.height
                }
            }
            if(jsonMessage.framerate) {
                def fps = [
                    "25": 25,
                    "20": 20,
                    "15": 15,
                    "10": 10,
                    "5": 5
                ]
                if(fps[jsonMessage.framerate.toString()]) {
                    room.videoSettings.framerate = fps[jsonMessage.framerate.toString()]
                }
            }
            if(jsonMessage.videoBitrate) {
                def bitrates = [
                    "2000": "2M",
                    "1000": "1M",
                    "500": "500k",
                    "300": "300k"
                ]
                if(bitrates[jsonMessage.videoBitrate.toString()]) {
                    room.videoSettings.videoBitrate = bitrates[jsonMessage.videoBitrate.toString()]
                }
            }
            if(jsonMessage.audioBitrate) {
                def bitrates = [
                    "192": "192k",
                    "96": "96k",
                    "64": "64k",
                    "48": "48k",
                    "32": "32k"
                ]
                if(bitrates[jsonMessage.audioBitrate.toString()]) {
                    room.videoSettings.audioBitrate = bitrates[jsonMessage.audioBitrate.toString()]
                }
            }
            if(jsonMessage.centerRemote) {
                room.centerRemote = true
            } else {
                room.centerRemote = false
            }
            // sendMessage(room.worker?.websocket, new RestartWorkerEvent())
        }
    }

    private void stop(Room room, String sessionId) {
        UserSession user = room.users.remove(sessionId)
        room.users.each { key, value ->
            if (value.username != null) {
                sendMessage(value.webSocketSession, new LeaveEvent(
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
            sendMessage(session, new PlayEndEvent())
        }
    }

    private void sendError(WebSocketSession session, String message) {
        sendMessage(session, new CozycastError(message: message))
    }

    @OnOpen
    void onOpen(String room, WebSocketSession session) {
        roomRegistry.getRoom(room).users.put(session.getId(), new UserSession(
                webSocketSession: session,
                username: "Anonymous",
                avatarUrl: "/png/default_avatar.png"
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
                case "worker_restart":
                    restartWorker(currentRoom, session, jsonMessage)
                    break;
                case "room_settings_save":
                    saveRoomSettings(currentRoom, session, jsonMessage)
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

    private void sendMessage(WebSocketSession session, Object message) {
        session.send(message)
            .subscribe({arg -> ""})
    }

    @OnClose
    void onClose(String room, WebSocketSession session) {
        stop(roomRegistry.getRoom(room), session.getId())
    }
}

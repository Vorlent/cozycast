package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketBroadcaster
import io.micronaut.websocket.annotation.OnClose
import io.micronaut.websocket.annotation.OnMessage
import io.micronaut.websocket.annotation.OnOpen
import io.micronaut.websocket.annotation.ServerWebSocket
import io.micronaut.websocket.WebSocketSession
import io.micronaut.websocket.CloseReason
import io.micronaut.security.token.jwt.validator.JwtTokenValidator
import io.micronaut.security.authentication.Authentication

import com.github.vorlent.cozycastserver.domain.ChatMessage
import com.github.vorlent.cozycastserver.UserState
import com.github.vorlent.cozycastserver.domain.RoomPermission
import com.github.vorlent.cozycastserver.service.RoomPermissionGormService

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

class UserActivityEvent {
    String action = "userActivityChange"
    String session
    Boolean active
    String lastTimeSeen
}

class UserMutedEvent {
    String action = "userMutedChange"
    String session
    Boolean muted
}

class ChatHistoryEvent {
    String action = "chat_history"
    List<ReceiveMessageEvent> messages
}

class ReceiveMessageEvent {
    String action = "receivemessage"
    String id
    String message
    String image
    String type
    String username
    String session
    String nameColor
    String timestamp
    boolean edited
    boolean anonymous
}

class DeleteMessageEvent {
    String action = "deletemessage"
    String id
}

class EditMessageEvent {
    String action = "editmessage"
    String id
    String message
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
    String session
}

class CozycastError {
    String action = "error"
    String message
}

class PlayEndEvent {
    String action = "playEnd"
}

class LoadUsersEvent {
    String action = "load_users"
    List<JoinEvent> users
}

class JoinEvent {
    String action = "join"
    String session
    String username
    String url
    String nameColor 
    Boolean active
    Boolean muted
    String lastTimeSeen
    Boolean anonymous
}


class AuthenticationEvent {
    String action = "authenticated"
    Boolean admin
    Boolean remotePermission
    Boolean imagePermission
}

class UnauthorizedEvent {
    String action = "unauthorized"
    String message
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

class BanEvent {
    String action = "ban"
    String session
    String expiration
}

class RestartWorkerEvent {
    String action = "worker_restart"
}

class UpdateWorkerSettingsEvent {
    String action = "worker_update_settings"
    VideoSettings settings
    Boolean restart
}

class CurrentRoomSettingsEvent {
    String action = "room_settings"
    Boolean accountOnly 
    Boolean verifiedOnly 
    Boolean inviteOnly 
    Boolean centerRemote 
    Boolean default_remote_permission
    Boolean default_image_permission
}

@Slf4j
@ServerWebSocket("/player/{room}")
class PlayerWebsocketServer {

    private KurentoClient kurento
    private WebSocketBroadcaster broadcaster
    private RoomRegistry roomRegistry
    private JwtTokenValidator jwtTokenValidator
    private final UserFetcher userFetcher
    private final RoomPermissionGormService roomPermissionGormService

    PlayerWebsocketServer(WebSocketBroadcaster broadcaster, KurentoClient kurento,
        RoomRegistry roomRegistry, JwtTokenValidator jwtTokenValidator,UserFetcher userFetcher,RoomPermissionGormService roomPermissionGormService) {
        this.broadcaster = broadcaster
        this.kurento = kurento
        this.roomRegistry = roomRegistry
        this.jwtTokenValidator = jwtTokenValidator
        this.userFetcher = userFetcher
        this.roomPermissionGormService = roomPermissionGormService
    }

    private void keepalive(Room room, WebSocketSession session, Map jsonMessage) {
        sendMessage(session, new KeepAlive())
    }

    private void userActivity(Room room, WebSocketSession session, Map jsonMessage){
        UserSession user = room.users.get(session.getId())
        if(user.active == !jsonMessage.tabbedOut){
            //no change no update
            return;
        }
        if(jsonMessage.tabbedOut){
            if(user.active){
                user.lastTimeSeen = ZonedDateTime.now(ZoneId.of("UTC")).minusMinutes(5)
                user.active = false
            }
        }
        else{
            user.active = true
        }
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new UserActivityEvent(
                session: session.getId(),
                active: user.active,
                lastTimeSeen: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(user.lastTimeSeen),
            ))
        }
    }

    private void userMuted(Room room, WebSocketSession session, Map jsonMessage){
        UserSession user = room.users.get(session.getId())
        if(user.muted == jsonMessage.muted){
            //no change no update
            return;
        }
        user.muted = jsonMessage.muted;
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new UserMutedEvent(
                session: session.getId(),
                muted: user.muted
            ))
        }
    }

    private void start(Room room, WebSocketSession session, Map jsonMessage) {
        final UserSession user = room.users.get(session.getId())
        user?.release()

        if(!room.worker) {
            throw new RuntimeException("NO WORKER FOUND")
        }

        MediaPipeline pipeline = room.worker.getMediaPipeline(kurento)
        WebRtcEndpoint webRtcEndpoint = new WebRtcEndpoint.Builder(pipeline).build()
        if(System.getenv("NETWORK_INTERFACES") != null) {
            webRtcEndpoint.setNetworkInterfaces(System.getenv("NETWORK_INTERFACES"));
        }
        if(System.getenv("EXTERNAL_IPV4") != null) {
            webRtcEndpoint.setExternalIPv4(System.getenv("EXTERNAL_IPV4"));
        }
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
        sendMessage(session, new StartResponse(sdpAnswer: sdpAnswer, videoSettings: room.videoSettings))

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
                    username: user.nickname,
                    lastTypingTime: new Date().getTime()
                ))
            }
        }
    }

    private void chatmessage(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        final UserSession user = room.users.get(session.getId())
        if(!(user.image_permission || room.default_image_permission) && (jsonMessage.type == 'image' || jsonMessage.type == 'video')) return;
        ZonedDateTime zonedDateTime = ZonedDateTime.now(ZoneId.of("UTC"))
        String nowAsISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(zonedDateTime)
        ChatMessage.withTransaction {
            ChatMessage.where { room == room.name &&
                timestamp < ZonedDateTime.now(ZoneId.of("UTC")).minusHours(1)
            }.list().each { it.delete() }
            ChatMessage.where { room == room.name }
                .list(sort: 'timestamp', order: 'desc', offset: 1000).each { it.delete() }
            def chatMessage = new ChatMessage(
                room: room.name,
                message: jsonMessage.message,
                image: jsonMessage.image,
                type: jsonMessage.type,
                username: user.nickname,
                session: user.anonymous ? session.getId() : user.username,
                nameColor: user.nameColor,
                anonymous: user.anonymous,
                timestamp: zonedDateTime,
                edited: false
            )
            if(chatMessage.validate()) {
                chatMessage.save();
                room.users.each { key, value ->
                sendMessage(value.webSocketSession, new ReceiveMessageEvent(
                    id: chatMessage.id,
                    message: chatMessage.message,
                    image: chatMessage.image,
                    type: chatMessage.type,
                    username: chatMessage.username,
                    session: chatMessage.session,
                    nameColor: chatMessage.nameColor,
                    anonymous: chatMessage.anonymous,
                    timestamp: nowAsISO,
                    edited: false
                ))
            }
            } else {
                log.warn "Chat message by user ${user.username} in room ${room.name} is too long: ${jsonMessage.message?.substring(0, 4096)}"
                return
            }
        }
    }

    private void deletemessage(Room room, WebSocketSession session, Map jsonMessage) {
        UserSession user = room.users.get(session.getId())
        ChatMessage.withTransaction {
            def message = ChatMessage.get(jsonMessage.id)
            if(message && message.room == room.name && (user.admin || ((message.anonymous && message.session == session.getId()) || (!message.anonymous && message.session == user.username)))){
                message.delete(); 
                room.users.each { key, value ->
                    sendMessage(value.webSocketSession, new DeleteMessageEvent (
                        id: message.id
                    ))
                }
            }
        }
    }

    private void editmessage(Room room, WebSocketSession session, Map jsonMessage) {
        UserSession user = room.users.get(session.getId())
        ChatMessage.withTransaction {
            def message = ChatMessage.get(jsonMessage.id)
            if(jsonMessage.message && (jsonMessage.message instanceof String) && jsonMessage.message.length() > 0 && message && message.type == "text" && message.room == room.name && ((message.anonymous && message.session == session.getId()) || (!message.anonymous && message.session == user.username))){
                message.message = jsonMessage.message;
                message.edited = true;
                message.save();
                room.users.each { key, value ->
                    sendMessage(value.webSocketSession, new EditMessageEvent (
                        id: message.id,
                        message: message.message
                    ))
                }
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
        user.nickname = jsonMessage.username
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new ChangeUsernameEvent(
                session: session.getId(),
                username: jsonMessage.username
            ))
        }
    }

    private Boolean checkusername(String username){
        if(username.length() > 12) {
            log.warn "Username ${username} is longer than 12 characters."
            return false;
        }
        return true;
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
        if(token != null) {
            def completed = false;
            def admin = false;
            boolean remote_permission = false;
            boolean image_permission = false;
            boolean invited = false;
            jwtTokenValidator.validateToken(token,null).subscribe({
                auth -> 
                    def name = auth.getName();
                    if(name != null) {
                        UserState user = userFetcher.findByUsername(name);
                        if(user != null){
                            admin = user.admin;
                            RoomPermission perm = roomPermissionGormService.findByUserAndRoom(user, room.name);
                            if(perm != null) {
                                if(perm.banned) {
                                    sendMessage(session, new UnauthorizedEvent(message: "Banned"))
                                    return;
                                }
                                if(room.inviteOnly  && !perm.invited){
                                    sendMessage(session, new UnauthorizedEvent(message: "Invites only"))
                                    return;
                                }
                                remote_permission = perm.remote_permission;
                                image_permission = perm.image_permission;
                                invited = perm.invited;
                            }
                            if( room.inviteOnly && !invited) {
                                sendMessage(session, new UnauthorizedEvent(message: "Invites only"))
                                return;
                            } else {
                                room.users.put(session.getId(), new UserSession(
                                    webSocketSession: session,
                                    username: user.getUsername(),
                                    nickname: user.getNickname(),
                                    avatarUrl: user.getAvatarUrl(),
                                    nameColor: user.getNameColor(),
                                    lastTimeSeen: ZonedDateTime.now(ZoneId.of("UTC")),
                                    active: true,
                                    muted: jsonMessage.muted,
                                    admin: user.isAdmin(),
                                    invited: invited,
                                    remote_permission: remote_permission,
                                    image_permission: image_permission,
                                    anonymous: false
                                ))
                                completed = true;
                            }
                        }else{
                            //TODO: ERROR IF USER SUDDENTLY DOES NOT EXIST ANYMORE
                        }
                    }
                },null,
                comp -> 
                {
                    if(!completed){
                        sendMessage(session, new UnauthorizedEvent(message: "Session expired"))
                    } else {
                        sendMessage(session, new AuthenticationEvent(admin: admin, remotePermission: remote_permission, imagePermission: image_permission))
                        joinActions(room,session,jsonMessage);
                    }
                }
            )
        } else {
            if(room.accountOnly || room.verifiedOnly || room.inviteOnly){
                sendMessage(session, new UnauthorizedEvent(message: "Accounts only"))
            } else {
                room.users.put(session.getId(), new UserSession(
                    webSocketSession: session,
                    username: "Anonymous",
                    nickname: "Anonymous",
                    avatarUrl: "/png/default_avatar_on_alpha.png",
                    nameColor: stringToColor(session.getId()),
                    lastTimeSeen: ZonedDateTime.now(ZoneId.of("UTC")),
                    active: true,
                    muted: jsonMessage.muted,
                    anonymous: true
                ))
                sendMessage(session, new AuthenticationEvent(admin: false, remotePermission: false, imagePermission: false));
                joinActions(room,session,jsonMessage);
            }
        }
    }

    private String stringToColor(String name) {
        int hash = 0;
        for (int i = 0; i < name.length(); i++) {
            hash = Character.codePointAt(name, i) + ((hash << 5) - hash);
        }
        String colour = '#';
        for (int i = 0; i < 3; i++) {
            int value = (hash >> (i * 8)) & 0xFF;
            String some =  Integer.toHexString(value);
            colour += (('00' + some).substring(some.length()));
        }
        return colour;
    }

    private void joinActions(Room room, WebSocketSession session, Map jsonMessage) {
        UserSession user = room.users.get(session.getId())

        sendMessage(session, new CurrentRoomSettingsEvent(
            accountOnly : room.accountOnly,
            verifiedOnly : room.verifiedOnly,
            inviteOnly : room.inviteOnly,
            centerRemote : room.centerRemote,
            default_remote_permission: room.default_remote_permission,
            default_image_permission: room.default_image_permission
        ))
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
                    }.list(sort: "timestamp", order: "desc", max: 500).collect {
                    new ReceiveMessageEvent(
                        id: it.id,
                        message: it.message,
                        image: it.image,
                        type: it.type,
                        username: it.username,
                        session: it.session,
                        nameColor: it.nameColor,
                        timestamp: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'")
                            .format(it.timestamp),
                        edited: it.edited
                    )
                }
            ))
        }

        //send existing users to new user
        sendMessage(session, new LoadUsersEvent(
            users: room.users.collect{key,value -> new JoinEvent(
                    session: key,
                    username: value.getNickname(),
                    url: value.getAvatarUrl(),
                    active:  value.getActive(),
                    nameColor: value.getNameColor(),
                    lastTimeSeen: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(value.getLastTimeSeen()),
                    muted: value.getMuted(),
                    anonymous: value.isAnonymous()
                ) 
                }
        ))

        room.users.each { key, value ->
            // send new user to existing users
            if(value.getWebSocketSession() != session) {
                sendMessage(value.webSocketSession, new JoinEvent(
                    session: session.getId(),
                    username: user.nickname,
                    url: user.avatarUrl,
                    active:  user.active,
                    nameColor: user.nameColor,
                    lastTimeSeen: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(user.lastTimeSeen),
                    muted: user.muted,
                    anonymous: user.anonymous
                ))
            }
        }

        //send remote info for joining user
        if(room.remote != null){
            sendMessage(session, new PickupRemoteEvent(
                session: room.remote,
                has_remote: room.remote == session.getId()))
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
        UserSession user = room.users.get(session.getId())
        if(!(user.remote_permission || room.default_remote_permission)) return
        room.remote = session.getId()
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new PickupRemoteEvent(
                session: session.getId(),
                has_remote: value.webSocketSession.getId() == session.getId()))
        }
        sendMessage(room.worker?.websocket, new ResetKeyboardEvent())
    }

    private void dropremote(Room room, WebSocketSession session, Map jsonMessage) {
        if(room.centerRemote || jsonMessage.center) {
            sendMessage(room.worker?.websocket, new MouseMoveEvent(
                mouseX: room.videoSettings.desktopWidth / 2,
                mouseY: room.videoSettings.desktopHeight / 2))
        }
        room.remote = null
        room.users.each { key, value ->
            sendMessage(value.webSocketSession, new DropRemoteEvent(
                session: session.getId()
            ))
        }
    }

    private void restartWorker(Room room, WebSocketSession session, Map jsonMessage) {
        UserSession user = room.users.get(session.getId())
        if(user.admin) {
            sendMessage(room.worker?.websocket, new RestartWorkerEvent())
        }
    }

    private void saveRoomSettings(Room room, WebSocketSession session, Map jsonMessage) {
        UserSession user = room.users.get(session.getId())
        if(user.admin) {
            def resolutions = [
                "1080": [ height: 1080, width: 1920 ],
                "720": [ height: 720, width: 1280 ],
                "480": [ height: 480, width: 853 ],
                "240": [ height: 240, width: 426 ],
                "144": [ height: 144, width: 256 ]
            ]
            if(jsonMessage.desktopResolution) {
                def res = resolutions[jsonMessage.desktopResolution.toString()]
                if(res) {
                    room.videoSettings.desktopWidth = res.width
                    room.videoSettings.desktopHeight = res.height
                }
            }
            if(jsonMessage.streamResolution) {
                def res = resolutions[jsonMessage.streamResolution.toString()]
                if(res) {
                    room.videoSettings.scaleWidth = res.width
                    room.videoSettings.scaleHeight = res.height
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
                    "2M": "2M",
                    "1M": "1M",
                    "500k": "500k",
                    "300k": "300k"
                ]
                if(bitrates[jsonMessage.videoBitrate.toString()]) {
                    room.videoSettings.videoBitrate = bitrates[jsonMessage.videoBitrate.toString()]
                }
            }
            if(jsonMessage.audioBitrate) {
                def bitrates = [
                    "192k": "192k",
                    "96k": "96k",
                    "64k": "64k",
                    "48k": "48k",
                    "32k": "32k"
                ]
                if(bitrates[jsonMessage.audioBitrate.toString()]) {
                    room.videoSettings.audioBitrate = bitrates[jsonMessage.audioBitrate.toString()]
                }
            }
            sendMessage(room.worker?.websocket, new UpdateWorkerSettingsEvent(settings: room.videoSettings, restart: true))
        } else {
            sendMessage(session, new CozycastError(message: "Not authorized"))
        }
    }

    private void saveRoomAccess(Room room, WebSocketSession session, Map jsonMessage) {
        log.info jsonMessage.toString()
        UserSession user = room.users.get(session.getId())
        if(user.admin) {
            if(jsonMessage.default_remote_permission){
                room.default_remote_permission = jsonMessage.default_remote_permission == "true"
            }
            if(jsonMessage.default_image_permission){
                room.default_image_permission = jsonMessage.default_image_permission == "true"
            }
            if(jsonMessage.accessType) {
                if(jsonMessage.accessType == "public") {
                    room.inviteOnly = false
                    room.verifiedOnly = false
                    room.accountOnly = false
                }
                if(jsonMessage.accessType == "authenticated") {
                    room.inviteOnly = false
                    room.verifiedOnly = false
                    room.accountOnly = true
                }
                if(jsonMessage.accessType == "invite") {
                    room.inviteOnly = false
                    room.verifiedOnly = false
                    room.inviteOnly = true
                }
            }
            if(jsonMessage.centerRemote) {
                room.centerRemote = true
            } else {
                room.centerRemote = false
            }
            def roomSettings =  new CurrentRoomSettingsEvent(
                accountOnly : room.accountOnly,
                verifiedOnly : room.verifiedOnly,
                inviteOnly : room.inviteOnly,
                centerRemote : room.centerRemote,
                default_remote_permission: room.default_remote_permission,
                default_image_permission: room.default_image_permission
            )
            room.users.each { key, roomUser ->
            if(roomUser != null) {
                if((room.accountOnly && roomUser.anonymous) || (room.inviteOnly && !roomUser.invited)){
                    roomUser.release()
                    if(roomUser.webSocketSession) {
                        try {
                            sendMessage(roomUser.webSocketSession, new UnauthorizedEvent(message: "Kicked"));
                            roomUser.webSocketSession.close(CloseReason.NORMAL)
                        } catch(IOException e) {
                            e.printStackTrace()
                        }
                    }
                }
                else{
                    sendMessage(roomUser.webSocketSession, roomSettings)
                }
            }
        }
        } else {
            sendMessage(session, new CozycastError(message: "Not authorized"))
        }
    }

    private void ban(Room room, WebSocketSession session, Map jsonMessage) {
        def bannedSession = jsonMessage.session
        UserSession modUser = room.users.get(session.getId())
        if(modUser.admin) {
            UserSession user = room.users.get(bannedSession)
            def expiration = "unlimited"
            if(jsonMessage.expiration.isInteger() && jsonMessage.expiration.toLong() > 0) {
                def expirationDate = ZonedDateTime.now(ZoneId.of("UTC"))
                expirationDate = expirationDate.plusMinutes(jsonMessage.expiration.toLong())
                expiration = expirationDate.toOffsetDateTime().toString()
            }
            sendMessage(user.webSocketSession, new BanEvent(
                session: bannedSession,
                expiration: expiration))
        }
        else {
            def banSource = room.users.get(session.getId()).username
            def banTarget = room.users.get(bannedSession).username
            log.info "${banSource} attempted to ban ${banTarget} without admin rights"
            sendMessage(session, new CozycastError(message: "Not authorized"))
        }
    }

    private void stop(Room room, String sessionId) {
        UserSession user = room.users.remove(sessionId)
        room.users.each { key, value ->
            if (value.username != null) {
                sendMessage(value.webSocketSession, new LeaveEvent(
                    session: sessionId
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

    @OnMessage
    void onMessage(WebSocketSession session, String room, Map jsonMessage) {
        String sessionId = session.getId()
        Room currentRoom = roomRegistry.getRoomNoCreate(room)
        if(currentRoom == null) {
            sendMessage(session, new UnauthorizedEvent(message: "Room does not exist"))
            session.close();
            return;
            }
        UserSession user = currentRoom.users.get(session.getId())
        if(user == null){
            if(jsonMessage.action == 'join'){
                join(currentRoom, session, jsonMessage);
            }
            else {
                sendMessage(session, new CozycastError(message: "No join event"))
            }
        }
        else {
            try {
                switch (jsonMessage.action) {
                    case "keepalive":
                        keepalive(currentRoom, session, jsonMessage)
                        break;
                    case "userActivity":
                        userActivity(currentRoom, session, jsonMessage)
                        break;
                    case "userMuted":
                        userMuted(currentRoom, session, jsonMessage)
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
                    case "deletemessage":
                        deletemessage(currentRoom, session, jsonMessage)
                        break;
                    case "editmessage":
                        editmessage(currentRoom, session, jsonMessage)
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
                        dropremote(currentRoom, session, jsonMessage)
                        break;
                    case "worker_restart":
                        restartWorker(currentRoom, session, jsonMessage)
                        break;
                    case "room_settings_save":
                        saveRoomSettings(currentRoom, session, jsonMessage)
                        break;
                    case "room_access_save":
                        saveRoomAccess(currentRoom, session, jsonMessage)
                        break;
                    case "ban":
                        ban(currentRoom, session, jsonMessage)
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
    }

    private void sendMessage(WebSocketSession session, Object message) {
        if(session) {
            session.send(message)
                .subscribe({arg -> ""})
        } else {
            log.error "session is null"
        }
    }

    @OnClose
    void onClose(String room, WebSocketSession session) {
        Room roomObj = roomRegistry.getRoomNoCreate(room);
        if(roomObj) stop(roomObj, session.getId())
    }
}

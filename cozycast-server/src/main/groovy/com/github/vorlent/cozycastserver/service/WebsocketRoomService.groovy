package com.github.vorlent.cozycastserver.service

import io.micronaut.websocket.WebSocketBroadcaster
import io.micronaut.websocket.annotation.OnClose
import io.micronaut.websocket.annotation.OnMessage
import io.micronaut.websocket.annotation.OnOpen
import io.micronaut.websocket.annotation.ServerWebSocket
import io.micronaut.websocket.WebSocketSession
import io.micronaut.websocket.CloseReason
import io.micronaut.security.token.jwt.validator.JwtTokenValidator
import io.micronaut.security.authentication.Authentication

import com.github.vorlent.cozycastserver.*
import com.github.vorlent.cozycastserver.UserState
import com.github.vorlent.cozycastserver.domain.ChatMessage
import com.github.vorlent.cozycastserver.domain.RoomPermission
import com.github.vorlent.cozycastserver.domain.User
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

class UpdateUserEvent {
    String action = "update_user"
    String session
    String username
    String url
    String nameColor 
    Boolean active
    Boolean muted
    String lastTimeSeen
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

import jakarta.inject.Singleton

@Slf4j
@Singleton
class WebsocketRoomService {

    private KurentoClient kurento
    private WebSocketBroadcaster broadcaster
    private RoomRegistry roomRegistry
    private JwtTokenValidator jwtTokenValidator
    private final UserFetcher userFetcher
    private final RoomPermissionGormService roomPermissionGormService

    WebsocketRoomService(WebSocketBroadcaster broadcaster, KurentoClient kurento,
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

    private void userActivity(Room room, WebSocketSession session, Map jsonMessage,String username){
        UserSession user = room.users.get(username)
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
            value.connections.each {sessionId, connection ->
                sendMessage(connection.webSocketSession, new UserActivityEvent(
                    session: username,
                    active: user.active,
                    lastTimeSeen: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(user.lastTimeSeen),
                ))
            }
        }
    }

    private void userMuted(Room room, WebSocketSession session, Map jsonMessage, String username){
        UserSession user = room.users.get(username)
        if(user.muted == jsonMessage.muted){
            //no change no update
            return;
        }
        user.muted = jsonMessage.muted;
        room.users.each { key, value ->
        value.connections.each {sessionId, connection ->
            sendMessage(connection.webSocketSession, new UserMutedEvent(
                session: username,
                muted: user.muted
            ))
        }}
    }

    private void start(Room room, WebSocketSession session, Map jsonMessage,String username) {
        final UserSession user = room.users.get(username)
        user?.release(session.getId())

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
        user.connections.computeIfPresent(session.getId(), (k,v) -> {v.webRtcEndpoint = webRtcEndpoint; return v});

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

    private void typing(Room room, WebSocketSession session, Map jsonMessage, String username) {
        log.info jsonMessage.toString()
        final UserSession user = room.users.get(username)
        room.users.each { key, value ->
        value.connections.each {sessionId, connection ->
            if(session.getId() != connection.getWebSocketSession().getId()) {
                sendMessage(connection.webSocketSession, new TypingEvent(
                    session: username,
                    state: jsonMessage.state,
                    username: user.nickname,
                    lastTypingTime: new Date().getTime()
                ))
            }
        }
        }
    }

    private void chatmessage(Room room, WebSocketSession session, Map jsonMessage,String username) {
        log.info jsonMessage.toString()
        final UserSession user = room.users.get(username)
        if(jsonMessage.message == null || jsonMessage.message.length() == 0) return;
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
                type: "text",
                username: user.nickname,
                session: username,
                nameColor: user.nameColor,
                anonymous: user.anonymous,
                timestamp: zonedDateTime,
                edited: false
            )
            if(chatMessage.validate()) {
                chatMessage.save();
                room.users.each { key, value ->
                value.connections.each {sessionId, connection ->
                sendMessage(connection.webSocketSession, new ReceiveMessageEvent(
                    id: chatMessage.id,
                    message: chatMessage.message,
                    type: "text",
                    username: chatMessage.username,
                    session: chatMessage.session,
                    nameColor: chatMessage.nameColor,
                    anonymous: chatMessage.anonymous,
                    timestamp: nowAsISO,
                    edited: false
                ))
            }}
            } else {
                log.warn "Chat message by user ${user.username} in room ${room.name} is too long: ${jsonMessage.message?.substring(0, 4096)}"
                return
            }
        }
    }

    public boolean checkImageRights(String room, String username){
        Room currentRoom = roomRegistry.getRoomNoCreate(room)
        if(currentRoom == null) return false;
        UserSession user = currentRoom.users.get(username)
        if(user == null) return false;
        if(!(user.image_permission || currentRoom.default_image_permission) && (jsonMessage.type == 'image' || jsonMessage.type == 'video')) return false;
        return true;
    }

    public void chatMedia(String roomName, String username, String url, String type) {
        Room room = roomRegistry.getRoomNoCreate(roomName);
        final UserSession user = room.users.get(username);
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
                message: "",
                image: url,
                type: type,
                username: user.nickname,
                session: username,
                nameColor: user.nameColor,
                anonymous: user.anonymous,
                timestamp: zonedDateTime,
                edited: false
            )
            if(chatMessage.validate()) {
                chatMessage.save();
                room.users.each { key, value ->
                value.connections.each {sessionId, connection ->
                sendMessage(connection.webSocketSession, new ReceiveMessageEvent(
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
            }
            } else {
                log.warn "Chat media posted by $username in room $roomName failed"
                return
            }
        }
    }

    private void deletemessage(Room room, WebSocketSession session, Map jsonMessage,String username) {
        UserSession user = room.users.get(username)
        ChatMessage.withTransaction {
            def message = ChatMessage.get(jsonMessage.id)
            if(message && message.room == room.name && (user.admin || ((message.anonymous && message.session == session.getId()) || (!message.anonymous && message.session == user.username)))){
                message.delete(); 
                room.users.each { key, value ->
                value.connections.each {sessionId, connection ->
                    sendMessage(connection.webSocketSession, new DeleteMessageEvent (
                        id: message.id
                    ))
                }
                }
            }
        }
    }

    private void editmessage(Room room, WebSocketSession session, Map jsonMessage,String username) {
        UserSession user = room.users.get(username)
        ChatMessage.withTransaction {
            def message = ChatMessage.get(jsonMessage.id)
            if(jsonMessage.message && (jsonMessage.message instanceof String) && jsonMessage.message.length() > 0 && message && message.type == "text" && message.room == room.name && ((message.anonymous && message.session == session.getId()) || (!message.anonymous && message.session == user.username))){
                message.message = jsonMessage.message;
                message.edited = true;
                message.save();
                room.users.each { key, value ->
                value.connections.each {sessionId, connection ->
                    sendMessage(connection.webSocketSession, new EditMessageEvent (
                        id: message.id,
                        message: message.message
                    ))
                }
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
        String username = session.getId()
        if(token != null) {
            def completed = false;
            def admin = false;
            boolean remote_permission = false;
            boolean image_permission = false;
            boolean invited = false;
            boolean existingUser = false;
            boolean verified = false;
            jwtTokenValidator.validateToken(token,null).subscribe({
                auth -> 
                    def name = auth.getName();
                    if(name != null) {
                        UserState user = userFetcher.findByUsername(name);
                        if(user != null){
                            username = user.getUsername();
                            admin = user.admin;
                            verified = user.verified || admin;
                            remote_permission = verified;
                            image_permission = verified;
                            invited = verified;
                            RoomPermission perm = roomPermissionGormService.findByUserAndRoom(user, room.name);
                            if(perm != null) {
                                if(perm.banned) {
                                    if(perm.bannedUntil == null) {
                                        sendMessage(session, new BanEvent(
                                            session: name,
                                            expiration: "unlimited"))
                                        return;
                                    }
                                    if(ZonedDateTime.now(ZoneId.of("UTC")) > perm.bannedUntil){
                                        roomPermissionGormService.updateBanned(perm.id,false)
                                    } else {
                                        sendMessage(session, new BanEvent(
                                            session: name,
                                            expiration: perm.bannedUntil.toOffsetDateTime().toString()))
                                        return;
                                    }

                                }
                                remote_permission = perm.remote_permission || verified;
                                image_permission = perm.image_permission || verified;
                                invited = perm.invited || verified;
                            }
                            if( room.inviteOnly && !invited) {
                                sendMessage(session, new UnauthorizedEvent(message: "Invites only"))
                                return;
                            } else {
                                UserSession userSession = room.users.get(username);
                                if(userSession){
                                    room.users.computeIfPresent(username,(key, oldValue) -> {
                                        oldValue.nickname = user.getNickname();
                                        oldValue.avatarUrl = user.getAvatarUrl();
                                        oldValue.nameColor = user.getNameColor();
                                        oldValue.lastTimeSeen = ZonedDateTime.now(ZoneId.of("UTC")); 
                                        oldValue.active = true;
                                        oldValue.muted = jsonMessage.muted;
                                        oldValue.admin = user.isAdmin()
                                        oldValue.invited = invited;
                                        oldValue.remote_permission = remote_permission;
                                        oldValue.image_permission = image_permission;
                                        oldValue.connections.put(session.getId(), new UserEndpoint(webSocketSession: session)); 
                                        return oldValue})
                                    existingUser = true;
                                }
                                else{
                                    userSession = new UserSession(
                                        username: username,
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
                                    )
                                    userSession.connections.put(session.getId(), new UserEndpoint(webSocketSession: session))
                                    room.users.put(username, userSession)
                                }
                                room.sessionToName.put(session.getId(), username)
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
                        joinActions(room,session,jsonMessage,username,existingUser);
                    }
                }
            )
        } else {
            if(room.accountOnly || room.verifiedOnly || room.inviteOnly){
                sendMessage(session, new UnauthorizedEvent(message: "Accounts only"))
            } else {
                UserSession anonSession = new UserSession(
                    username: "Anonymous",
                    nickname: "Anonymous",
                    avatarUrl: "/png/default_avatar_on_alpha.png",
                    nameColor: stringToColor(session.getId()),
                    lastTimeSeen: ZonedDateTime.now(ZoneId.of("UTC")),
                    active: true,
                    muted: jsonMessage.muted,
                    anonymous: true
                )
                anonSession.connections.put(session.getId(), new UserEndpoint(webSocketSession: session));
                room.users.put(session.getId(),anonSession)
                room.sessionToName.put(session.getId(), session.getId())
                sendMessage(session, new AuthenticationEvent(admin: false, remotePermission: false, imagePermission: false));
                joinActions(room,session,jsonMessage,username,false);
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

    private void joinActions(Room room, WebSocketSession session, Map jsonMessage, String username, Boolean existingUser) {
        log.info "Join actions started for $username"
        UserSession user = room.users.get(username)

        sendMessage(session, new CurrentRoomSettingsEvent(
            accountOnly : room.accountOnly,
            verifiedOnly : room.verifiedOnly,
            inviteOnly : room.inviteOnly,
            centerRemote : room.centerRemote,
            default_remote_permission: room.default_remote_permission,
            default_image_permission: room.default_image_permission
        ))
        sendMessage(session, new SessonIdEvent(
            session: username
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
                        anonymous: it.anonymous,
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

        if(!existingUser){
            room.users.each { key, value ->
                // send new user to existing users
                value.connections.each {sessionId, connection ->
                if(connection.getWebSocketSession() != session) {
                    sendMessage(connection.webSocketSession, new JoinEvent(
                        session: user.anonymous ? session.getId() : user.username,
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
            }
        }
        else {
            updateUser(room,session,user);
        }

        //send remote info for joining user
        if(room.remote != null){
            sendMessage(session, new PickupRemoteEvent(
                session: room.sessionToName.get(room.remote),
                has_remote: room.remote == session.getId()))
        }
    }

    private void updateProfile(Room room, WebSocketSession session, String username){
        UserState user = userFetcher.findByUsername(username);
        if(user != null){
            UserSession userSession = room.users.get(username);
            if(userSession){
                room.users.computeIfPresent(username,(key, oldValue) -> {
                        oldValue.nickname = user.getNickname();
                        oldValue.avatarUrl = user.getAvatarUrl();
                        oldValue.nameColor = user.getNameColor();
                        oldValue.lastTimeSeen = ZonedDateTime.now(ZoneId.of("UTC")); 
                        oldValue.active = true;
                    return oldValue;});
                updateUser(room,null,userSession);
            }
        }
    }

    private void updateUser(Room room, WebSocketSession session, UserSession user){
        room.users.each { key, value ->
            // update user for all
            value.connections.each {sessionId, connection ->
                if(connection.getWebSocketSession() != session) {
                    sendMessage(connection.webSocketSession, new UpdateUserEvent(
                        session: user.username,
                        username: user.nickname,
                        url: user.avatarUrl,
                        active:  user.active,
                        nameColor: user.nameColor,
                        lastTimeSeen: DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm'Z'").format(user.lastTimeSeen),
                        muted: user.muted
                    ))
                }
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

    private void pickupremote(Room room, WebSocketSession session, String username) {
        UserSession user = room.users.get(username)
        if(!(user.remote_permission || room.default_remote_permission)) return
        room.remote = session.getId()
        room.users.each { key, value ->
        value.connections.each {sessionId, connection ->
            sendMessage(connection.webSocketSession, new PickupRemoteEvent(
                session: username,
                has_remote: sessionId == session.getId()))
        }
        }
        sendMessage(room.worker?.websocket, new ResetKeyboardEvent())
    }

    private void dropremote(Room room, WebSocketSession session, Map jsonMessage,String username) {
        if(room.centerRemote || jsonMessage.center) {
            sendMessage(room.worker?.websocket, new MouseMoveEvent(
                mouseX: room.videoSettings.desktopWidth / 2,
                mouseY: room.videoSettings.desktopHeight / 2))
        }
        room.remote = null
        room.users.each { key, value ->
        value.connections.each {sessionId, connection ->
            sendMessage(connection.webSocketSession, new DropRemoteEvent(
                session: username
            ))
        }
        }
    }

    private void restartWorker(Room room, WebSocketSession session, Map jsonMessage,String username) {
        UserSession user = room.users.get(username)
        if(user.admin) {
            sendMessage(room.worker?.websocket, new RestartWorkerEvent())
        }
    }

    private void saveRoomSettings(Room room, WebSocketSession session, Map jsonMessage,String username) {
        UserSession user = room.users.get(username)
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

    private void saveRoomAccess(Room room, WebSocketSession session, Map jsonMessage,String username) {
        log.info jsonMessage.toString()
        UserSession user = room.users.get(username)
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
                    roomUser.connections.each {sessionId, connection ->
                        connection.webRtcEndpoint?.release();
                        if(connection.webSocketSession) {
                            try {
                                sendMessage(connection.webSocketSession, new UnauthorizedEvent(message: "Kicked"));
                                connection.webSocketSession.close(CloseReason.NORMAL)
                            } catch(IOException e) {
                                e.printStackTrace()
                            }
                        }
                    }
                }
                else{
                    roomUser.connections.each {sessionId, connection ->
                        sendMessage(connection.webSocketSession, roomSettings)
                    }
                }
            }
        }
        } else {
            sendMessage(session, new CozycastError(message: "Not authorized"))
        }
    }

    private void ban(Room room, WebSocketSession session, Map jsonMessage,String username) {
        def bannedSession = jsonMessage.session
        UserSession modUser = room.users.get(username)
        if(modUser.admin) {
            UserSession user = room.users.get(bannedSession)
            def expiration = "unlimited"
            def expirationDate = null
            if(jsonMessage.expiration.isInteger() && jsonMessage.expiration.toLong() >= 0) {
                expirationDate = ZonedDateTime.now(ZoneId.of("UTC"))
                expirationDate = expirationDate.plusMinutes(jsonMessage.expiration.toLong())
                expiration = expirationDate.toOffsetDateTime().toString()
            }
            User.withTransaction{
            User userDb = User.get(bannedSession)
            if(userDb != null){
            RoomPermission.withTransaction {
                RoomPermission perms = RoomPermission.findByUserAndRoom(userDb,room.name)
                if(perms == null){
                    perms = new RoomPermission(
                        user: userDb,
                        room: room.name,
                        invited: false,
                        banned: true,
                        bannedUntil: expirationDate,
                        remote_permission: false,
                        image_permission: false
                    )
                } else{
                        perms.banned = true;
                        perms.bannedUntil = expirationDate
                }
                perms.save();
            }
            }
        }
            user.connections.each {sessionId, connection ->
                sendMessage(connection.webSocketSession, new BanEvent(
                    session: bannedSession,
                    expiration: expiration))
                connection.webSocketSession.close();
            }
        }
        else {
            def banSource = username
            def banTarget = bannedSession
            log.info "${banSource} attempted to ban ${banTarget} without admin rights"
            sendMessage(session, new CozycastError(message: "Not authorized"))
        }
    }

    private void stop(Room room, String sessionId) {
        String username = room.sessionToName.remove(sessionId)
        if(!username) return;
        UserSession user = room.users.get(username)
        user?.release(sessionId);
        int size = -1;
        room.users.computeIfPresent(username, (key,value) -> {value.connections.remove(sessionId); size = value.connections.size(); return value;})
        log.info "removed user ${username}, connections present for user: $size"
        if(size == 0) {
            room.users.remove(username)
            room.users.each { key, value ->
                value.connections.each {sessionIdKey, connection ->
                    if (connection.webSocketSession != null) {
                        sendMessage(connection.webSocketSession, new LeaveEvent(
                            session: username
                        ))
                    }
                }
            }
        }
        
    }

    private void onIceCandidate(Room room, String sessionId, Map jsonMessage, String username) {
        UserSession user = room.users.get(username)

        if (user != null) {
            Map jsonCandidate = jsonMessage.candidate;
            log.info jsonCandidate.toString()
            IceCandidate candidate = new IceCandidate(
                jsonCandidate.candidate,
                jsonCandidate.sdpMid,
                jsonCandidate.sdpMLineIndex)
            user.connections.computeIfPresent(sessionId, (k,v) -> {v.webRtcEndpoint?.addIceCandidate(candidate); return v});
        }
    }

    private void sendPlayEnd(Room room, WebSocketSession session) {
        if (room.users.containsKey(session.getId())) {
            sendMessage(session, new PlayEndEvent())
        }
    }

    private void sendError(WebSocketSession session, String message) {
        sendMessage(session, new CozycastError(message: message))
    }

    private void sendMessage(WebSocketSession session, Object message) {
        if(session) {
            session.send(message)
                .subscribe({arg -> ""})
        } else {
            log.error "session is null"
        }
    }

    public void onClose(String room, WebSocketSession session) {
        Room roomObj = roomRegistry.getRoomNoCreate(room);
        if(roomObj) stop(roomObj, session.getId())
    }

    public void onMessage(WebSocketSession session, String room, Map jsonMessage) {
        String sessionId = session.getId()
        Room currentRoom = roomRegistry.getRoomNoCreate(room)
        if(currentRoom == null) {
            sendMessage(session, new UnauthorizedEvent(message: "Room does not exist"))
            session.close();
            return;
            }
        String username = currentRoom.sessionToName.get(sessionId)
        if(username == null){
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
                        userActivity(currentRoom, session, jsonMessage, username)
                        break;
                    case "userMuted":
                        userMuted(currentRoom, session, jsonMessage, username)
                        break;
                    case "start":
                        start(currentRoom, session, jsonMessage, username)
                        break;
                    case "stop":
                        stop(currentRoom, sessionId)
                        break;
                    case "typing":
                        typing(currentRoom, session, jsonMessage, username)
                        break;
                    case "updateprofile":
                        updateProfile(currentRoom, session, username)
                        break;
                    case "chatmessage":
                        chatmessage(currentRoom, session, jsonMessage, username)
                        break;
                    case "deletemessage":
                        deletemessage(currentRoom, session, jsonMessage, username)
                        break;
                    case "editmessage":
                        editmessage(currentRoom, session, jsonMessage, username)
                        break;
                    //case "changeusername":
                    //    changeusername(currentRoom, session, jsonMessage)
                    //    break;
                    //case "changeprofilepicture":
                    //    changeprofilepicture(currentRoom, session, jsonMessage)
                    //    break;
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
                        pickupremote(currentRoom, session, username)
                        break;
                    case "drop_remote":
                        dropremote(currentRoom, session, jsonMessage, username)
                        break;
                    case "worker_restart":
                        restartWorker(currentRoom, session, jsonMessage, username)
                        break;
                    case "room_settings_save":
                        saveRoomSettings(currentRoom, session, jsonMessage, username)
                        break;
                    case "room_access_save":
                        saveRoomAccess(currentRoom, session, jsonMessage, username)
                        break;
                    case "ban":
                        ban(currentRoom, session, jsonMessage, username)
                        break;
                    case "onIceCandidate":
                        onIceCandidate(currentRoom, sessionId, jsonMessage, username)
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
}

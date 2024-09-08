package com.github.vorlent.cozycastserver.events

import com.github.vorlent.cozycastserver.*

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

class UserListInfo {
    String action = "user_list_info"
    List<UserSessionInfo> users
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
    boolean whisper = false
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
    String username
    Boolean anonymous
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
    String userEntryTime
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
    Boolean trusted
    Boolean anonymous
}

class UpdatePermissionEvent {
    String action = "updatePermission"
    Boolean trusted
    Boolean remotePermission
    Boolean imagePermission
}

class UnauthorizedEvent {
    String action = "unauthorized"
    String message
}

class NextRestartAvailable {
    String action = "nextRestartAvailable"
    String time
}

class TextinputEvent {
    String action = "textinput"
    String text
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

class RateLimitExceededEvent {
    String action = "rateLimitExceeded"
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
    Boolean remote_ownership
    Boolean default_remote_permission
    Boolean default_image_permission
    Boolean hidden_to_unauthorized
}
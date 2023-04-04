package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession
import java.time.ZonedDateTime
import java.util.concurrent.ConcurrentHashMap

import org.kurento.client.WebRtcEndpoint

class UserEndpoint {
    WebRtcEndpoint webRtcEndpoint
    WebSocketSession webSocketSession
}


class UserSession {
    final ConcurrentHashMap<String, UserEndpoint> connections = new ConcurrentHashMap<>()
    String username
    String nickname
    String avatarUrl
    String nameColor
    Boolean active
    Boolean muted
    Boolean anonymous
    Boolean invited
    Boolean admin = false
    Boolean verified = false
    Boolean trusted = false
    Boolean remote_permission = false
    Boolean image_permission = false
    ZonedDateTime lastTimeSeen

    public void release(String id) {
        connections.computeIfPresent(id, (k,v) -> {v.webRtcEndpoint?.release(); return v});
    }
}

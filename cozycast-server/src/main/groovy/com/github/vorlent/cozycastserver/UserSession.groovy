package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession
import java.time.ZonedDateTime

import org.kurento.client.WebRtcEndpoint

class UserSession {
    WebRtcEndpoint webRtcEndpoint
    WebSocketSession webSocketSession
    String username
    String nickname
    String avatarUrl
    String nameColor
    Boolean active
    Boolean muted
    Boolean anonymous
    Boolean admin = false
    Boolean remote_permission
    Boolean image_permission
    ZonedDateTime lastTimeSeen

    public void release() {
        webRtcEndpoint?.release()
    }
}

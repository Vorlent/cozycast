package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession
import java.time.ZonedDateTime

import org.kurento.client.WebRtcEndpoint

class UserSession {
    WebRtcEndpoint webRtcEndpoint
    WebSocketSession webSocketSession
    String username
    String avatarUrl
    Boolean active
    ZonedDateTime lastTimeSeen

    public void release() {
        webRtcEndpoint?.release()
    }
}

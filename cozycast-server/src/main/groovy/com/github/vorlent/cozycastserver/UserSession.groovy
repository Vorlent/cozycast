package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession

import org.kurento.client.WebRtcEndpoint

class UserSession {
    WebRtcEndpoint webRtcEndpoint
    WebSocketSession webSocketSession
    String username
    String avatarUrl

    public void release() {
        webRtcEndpoint?.release()
    }
}

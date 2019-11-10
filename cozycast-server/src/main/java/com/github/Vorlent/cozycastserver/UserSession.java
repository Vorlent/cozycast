package com.github.vorlent.cozycastserver;

import org.kurento.client.IceCandidate;
import org.kurento.client.MediaPipeline;
import org.kurento.client.WebRtcEndpoint;
import org.kurento.client.RtpEndpoint;
import org.springframework.web.socket.WebSocketSession;

public class UserSession {

    private WebRtcEndpoint webRtcEndpoint;
    private WebSocketSession webSocketSession;
    private String username;

    public UserSession() {
    }

    public WebRtcEndpoint getWebRtcEndpoint() {
        return webRtcEndpoint;
    }

    public void setWebRtcEndpoint(WebRtcEndpoint webRtcEndpoint) {
        this.webRtcEndpoint = webRtcEndpoint;
    }

    public WebSocketSession getWebSocketSession() {
        return webSocketSession;
    }

    public void setWebSocketSession(WebSocketSession webSocketSession) {
        this.webSocketSession = webSocketSession;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void addCandidate(IceCandidate candidate) {
        webRtcEndpoint.addIceCandidate(candidate);
    }

    public void release() {
        if(this.webRtcEndpoint != null) {
            this.webRtcEndpoint.release();
        }
    }
}

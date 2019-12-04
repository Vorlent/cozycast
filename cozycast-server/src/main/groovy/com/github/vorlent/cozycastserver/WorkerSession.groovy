package com.github.vorlent.cozycastserver

import io.micronaut.websocket.WebSocketSession

import org.kurento.client.MediaPipeline
import org.kurento.client.RtpEndpoint
import org.kurento.client.KurentoClient

class WorkerSession {
    MediaPipeline mediaPipeline
    RtpEndpoint rtpEndpoint
    WebSocketSession websocket
    VideoSettings videoSettings

    MediaPipeline getMediaPipeline(KurentoClient kurento) {
        if(mediaPipeline == null) {
            mediaPipeline = kurento.createMediaPipeline()
        }
        return mediaPipeline
    }

    void close() {
        mediaPipeline?.release()
    }
}

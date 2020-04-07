package com.github.vorlent.cozycastserver

import java.util.concurrent.ConcurrentHashMap

import io.micronaut.websocket.CloseReason

class Room {
    String name
    final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>()
    WorkerSession worker
    String remote
    String title
    Boolean inviteOnly = false
    Boolean centerRemote = false
    VideoSettings videoSettings = new VideoSettings(
        desktopWidth: 1280,
        desktopHeight: 720,
        scaleWidth: 1280,
        scaleHeight: 720,
        framerate: 25,
        videoBitrate: "1M",
        audioBitrate: "96k"
    )

    def close(restart = false) {
        worker?.close()
        users.each { key, user ->
            if(user != null) {
                user.release()
                if(user.webSocketSession) {
                    try {
                        user.webSocketSession.close(restart ? CloseReason.SERVICE_RESTART : CloseReason.GOING_AWAY)
                    } catch(IOException e) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }
}

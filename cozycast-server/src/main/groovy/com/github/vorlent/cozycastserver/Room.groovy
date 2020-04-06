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
    VideoSettings videoSettings = new VideoSettings()

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

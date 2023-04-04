package com.github.vorlent.cozycastserver

import java.util.concurrent.ConcurrentHashMap
import java.time.format.DateTimeFormatter
import java.time.ZonedDateTime
import java.time.ZoneId

import io.micronaut.websocket.CloseReason

import com.github.vorlent.cozycastserver.domain.RoomPersistence

class StopStreamEvent {
    String action = "stop_stream"
}

class StartStreamEvent {
    String action = "start_stream"
}

class Room {
    String name
    final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>()
    final ConcurrentHashMap<String, String> sessionToName = new ConcurrentHashMap<>()
    WorkerSession worker
    String remote = null
    String title
    Boolean accountOnly = false
    Boolean verifiedOnly = false
    Boolean inviteOnly = false
    Boolean centerRemote = false
    Boolean remote_ownership = false
    Boolean default_remote_permission = false
    Boolean default_image_permission = false
    VideoSettings videoSettings = new VideoSettings(
        desktopWidth: 1280,
        desktopHeight: 720,
        scaleWidth: 1280,
        scaleHeight: 720,
        framerate: 25,
        videoBitrate: "1M",
        audioBitrate: "96k"
    )

    ZonedDateTime lastRestarted = ZonedDateTime.now(ZoneId.of("UTC"));

    Room(RoomPersistence roomPersistence){
        this.name = roomPersistence.name;
        this.accountOnly = roomPersistence.accountOnly
        this.verifiedOnly = roomPersistence.verifiedOnly
        this.inviteOnly = roomPersistence.inviteOnly
        this.centerRemote = roomPersistence.centerRemote
        this.remote_ownership = roomPersistence.remote_ownership
        this.default_remote_permission = roomPersistence.default_remote_permission
        this.default_image_permission = roomPersistence.default_image_permission

        this.videoSettings = new VideoSettings(
            desktopWidth: roomPersistence.desktopWidth,
            desktopHeight: roomPersistence.desktopHeight,
            scaleWidth: roomPersistence.scaleWidth,
            scaleHeight: roomPersistence.scaleHeight,
            framerate: roomPersistence.framerate,
            videoBitrate: roomPersistence.videoBitrate,
            audioBitrate: roomPersistence.audioBitrate
        )
    }

    Room(){};

    def getUserInfo() {
        List<UserSessionInfo> userSessionInfoList = users.values().stream()
        .map({ userSession -> new UserSessionInfo(userSession) })
        .collect()
        return userSessionInfoList;
    }


    def restartByUser(){
        if(ZonedDateTime.now(ZoneId.of("UTC")).minusHours(1) > lastRestarted){
            lastRestarted = ZonedDateTime.now(ZoneId.of("UTC"));
            return true;
        }
        else return false;
    }

    def restartByAdmin(){
        lastRestarted = ZonedDateTime.now(ZoneId.of("UTC"));
    }

    def close(restart = false) {
        worker?.close()
        users.each { key, user ->
            if(user != null) {
                user.connections.each {sessionId, connection ->
                    connection.webRtcEndpoint?.release();
                    if(connection.webSocketSession) {
                        try {
                            connection.webSocketSession.close(restart ? CloseReason.SERVICE_RESTART : CloseReason.GOING_AWAY)
                        } catch(IOException e) {
                            e.printStackTrace()
                        }
                    }
                }
            }
        }
    }

    def stopStream() {
        worker?.close()
        worker = null
        users.each { key, user ->
            if(user != null) {
                user.connections.each {sessionId, connection ->
                    connection.webRtcEndpoint?.release();
                    if(connection.webSocketSession) {
                        connection.webSocketSession.send(new StopStreamEvent()).subscribe({arg -> ""})
                    }
                }
            }
        }
    }

    def startStream(WorkerSession workerNew = null) {
        worker?.close()
        worker = workerNew
        users.each { key, user ->
            if(user != null) {
                user.connections.each {sessionId, connection ->
                    connection.webRtcEndpoint?.release();
                    if(connection.webSocketSession) {
                        connection.webSocketSession.send(new StartStreamEvent()).subscribe({arg -> ""})
                    }
                }
            }
        }
    }
}

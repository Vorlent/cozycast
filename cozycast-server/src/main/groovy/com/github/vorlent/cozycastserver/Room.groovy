package com.github.vorlent.cozycastserver

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.time.format.DateTimeFormatter
import java.time.ZonedDateTime
import java.time.ZoneId
import io.micronaut.websocket.WebSocketSession
import com.github.vorlent.cozycastserver.events.LeaveEvent
import com.github.vorlent.cozycastserver.events.DropRemoteEvent
import com.github.vorlent.cozycastserver.events.MouseMoveEvent
import com.github.vorlent.cozycastserver.events.CurrentRoomSettingsEvent
import com.github.vorlent.cozycastserver.events.WindowTitleEvent

import org.kurento.client.MediaType

import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

import groovy.util.logging.Slf4j
import org.slf4j.LoggerFactory

import io.micronaut.websocket.CloseReason

import com.github.vorlent.cozycastserver.domain.RoomPersistence

class StopStreamEvent {
    String action = 'stop_stream'
}

class StartStreamEvent {
    String action = 'start_stream'
}

class StreamStatusEvent {
    String action = 'stream_status'
    Boolean managed_vm
    Boolean running
}

@Slf4j
class Room {

    String name
    private Boolean managed_vm = true
    private static final vmLogger = LoggerFactory.getLogger('vm.management')
    private final ExecutorService executorService = Executors.newSingleThreadScheduledExecutor()
    private Future<?> scheduledStopTask
    final AtomicBoolean isVMRunning = new AtomicBoolean(false)
    private final AtomicInteger activeUsers = new AtomicInteger(0)
    final ConcurrentHashMap<String, UserSession> users = new ConcurrentHashMap<>()
    final ConcurrentHashMap<String, String> sessionToName = new ConcurrentHashMap<>()
    WorkerSession worker
    String remote = null
    String title
    Boolean accountOnly = false
    Boolean verifiedOnly = false
    Boolean inviteOnly = false
    Boolean hidden_to_unauthorized = false
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
        videoBitrate: '1M',
        audioBitrate: '96k'
    )

    ZonedDateTime lastRestarted = ZonedDateTime.now(ZoneId.of('UTC'))

    Room(RoomPersistence roomPersistence) {
        this.name = roomPersistence.name
        this.accountOnly = roomPersistence.accountOnly
        this.verifiedOnly = roomPersistence.verifiedOnly
        this.inviteOnly = roomPersistence.inviteOnly
        this.centerRemote = roomPersistence.centerRemote
        this.remote_ownership = roomPersistence.remote_ownership
        this.hidden_to_unauthorized = roomPersistence.hidden_to_unauthorized
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

    Room() { }

    // Method to increment the user count
    void newStreamStart() {
        int activUsersInt = activeUsers.incrementAndGet()
        vmLogger.info(name + ', active users:' + activUsersInt)
        log.info "added, active users $activUsersInt"
        startVM()
    }

    // Method to decrement the user count and check if it is zero
    void streamStop() {
        int remainingUsers = activeUsers.decrementAndGet()
        log.info "removed, active users $remainingUsers" 
        if (remainingUsers == 0){
            stopVM()
        }
    }

    void broadcast(Object event) {
        users.each { key, user ->
            user.connections.each { sessionIdKey, connection ->
                if (connection.webSocketSession != null) {
                    sendMessage(connection.webSocketSession, event)
                }
            }
        }
    }

    void exclusive_broadcast(Object event, String sessionId) {
        users.each { key, user ->
            user.connections.each { sessionIdKey, connection ->
                if (sessionId != sessionIdKey) {
                    if (connection.webSocketSession != null) {
                        sendMessage(connection.webSocketSession, event)
                    }
                }
            }
        }
    }

    void sendMessage(WebSocketSession session, Object message) {
        if (session != null) {
            try {
                session.send(message).subscribe(
                    { arg -> '' },
                    { error -> log.error("Failed to send message: $error.message")
                    })
            } catch (Exception e) {
                log.error("An error occurred while sending the message: ${e.message}")
            }
        } else {
            log.error('session is null')
        }
    }

    void dropremote(Map jsonMessage, String username) {
        if (centerRemote || jsonMessage?.center) {
            sendMessage(worker?.websocket, new MouseMoveEvent(
                mouseX: videoSettings.desktopWidth / 2,
                mouseY: videoSettings.desktopHeight / 2))
        }
        remote = null
        broadcast(new DropRemoteEvent(
                session: username
            ))
    }

    void removeUser(String sessionId) {
        String username = sessionToName.remove(sessionId)
        if (!username) { return }
        UserSession user = users.get(username)
        if (remote == username) {
            dropremote(null, username)
        }
        user?.release(sessionId)
        int size = -1
        users.computeIfPresent(username, (key, value) ->
            {
                value.connections.remove(sessionId)
                size = value.connections.size()
                return value
            })
        log.info "removed user ${username}, connections present for user: $size"
        if (size == 0) {
            users.remove(username)
            broadcast(new LeaveEvent(
                            session: username,
                            username: user.nickname,
                            anonymous: user.anonymous))
        }
        leaveActionVM()
    }

    void startVM() {
        if (isVMRunning.compareAndSet(false, true)) {  // Only proceed if VM is not already running
            //mimic start stream event
            releaseAllUsers(new StartStreamEvent())
            vmLogger.info(name + ', starting vm')

            //TODO: only update the status after the VM is actually online
            broadcast(new StreamStatusEvent(
                managed_vm: managed_vm,
                running: isVMRunning.get()
            ))
        }
    }

    void stopVM() {
        if (isVMRunning.compareAndSet(true, false)) {  // Only proceed if VM is not already running
            //mimic stopping the vm
            broadcast(new StreamStatusEvent(
                managed_vm: managed_vm,
                running: isVMRunning.get()
            ))
            releaseAllUsers(new StopStreamEvent())
            vmLogger.info(name + ', stopping vm')
        }
    }

    private def checkIfWebRtcEndpointOpenForAnyUser() {
        def isAnyOpen = false

        users.each { key, user ->
            if (user != null) {
                log.info("$user.username")
                user.connections.each { sessionId, connection ->
                    log.info("$sessionId $connection")
                    log.info("webrtc $connection.webRtcEndpoint")
                if (connection?.webRtcEndpoint != null) {
                    // Check if media is flowing in or out (audio or video)
                    def mediaFlowInVideo = connection.webRtcEndpoint.isMediaFlowingIn(MediaType.VIDEO)
                    log.info("MediaFlowIn (VIDEO): $mediaFlowInVideo for sessionId: $sessionId")
                    // Check if media is flowing in or out for AUDIO
                    def mediaFlowInAudio = connection.webRtcEndpoint.isMediaFlowingIn(MediaType.AUDIO)
                    log.info("MediaFlowIn (AUDIO): $mediaFlowInAudio for sessionId: $sessionId")


                    if (mediaFlowInVideo  || mediaFlowInAudio) {
                        log.info("WebRTC media is flowing")
                        isAnyOpen = true  // Set flag if media is flowing
                        return false  // Exit if any active connection is found
                    }
                }
                }
                if (isAnyOpen) {
                    return // Break out of the outer closure
                }
            }
        }

        return !isAnyOpen  // Return true if no open connection was found, false otherwise
    }

    void stopVmManual(){
        if(checkIfWebRtcEndpointOpenForAnyUser()){
            log.info "All closed shut down"
        }
        else log.info "At least one open"

        //PLEINAIR, fix checkifweb... meme and then stop the vm only then if no active connections are online
        stopVM()
    }

    void joinActaionVM(WebSocketSession session) {

        sendMessage(session, new CurrentRoomSettingsEvent(
            accountOnly : accountOnly,
            verifiedOnly : verifiedOnly,
            inviteOnly : inviteOnly,
            centerRemote : centerRemote,
            remote_ownership: remote_ownership,
            default_remote_permission: default_remote_permission,
            default_image_permission: default_image_permission,
            hidden_to_unauthorized: hidden_to_unauthorized
        ))

        sendMessage(session, new WindowTitleEvent(
            title: (title ?: '')
        ))

        sendMessage(session, new StreamStatusEvent(
            managed_vm: managed_vm,
            running: isVMRunning.get()
        ))

        if(isVMRunning.get()) sendMessage(session, new StartStreamEvent())

        vmLogger.info(name + ', Current users:' + users.size())
        cancelStopVM()
    }

    void leaveActionVM() {
        vmLogger.info(name + ', Current users:' + users.size())
        if (users.isEmpty()) {
            cancelStopVM()
            // Schedule a new task to stop the VM after 5 minutes
            scheduledStopTask = executorService.schedule({
                stopVM()
            }, 5, TimeUnit.MINUTES)
            vmLogger.info(name + ', VM stop rescheduled for 5 minutes later.')
        }
    }

    List<UserSessionInfo> getUserInfo() {
        List<UserSessionInfo> userSessionInfoList = users.values().stream()
        .map({ userSession -> new UserSessionInfo(userSession) })
        .collect()
        return userSessionInfoList
    }

    Boolean restartByUser() {
        if (ZonedDateTime.now(ZoneId.of('UTC')).minusHours(1) > lastRestarted) {
            lastRestarted = ZonedDateTime.now(ZoneId.of('UTC'))
            return true
        }
        return false
    }

    void restartByAdmin() {
        lastRestarted = ZonedDateTime.now(ZoneId.of('UTC'))
    }

    void close(restart = false) {
        worker?.close()
        users.each { key, user ->
            if (user != null) {
                user.connections.each { sessionId, connection ->
                    connection.webRtcEndpoint?.release()
                    if (connection.webSocketSession) {
                        try {
                            connection.webSocketSession.close(restart ? CloseReason.SERVICE_RESTART : CloseReason.GOING_AWAY)
                        } catch (IOException e) {
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
        releaseAllUsers(new StopStreamEvent())
    }

    def startStream(WorkerSession workerNew = null) {
        worker?.close()
        worker = workerNew
        releaseAllUsers(new StartStreamEvent())
    }

    private void cancelStopVM() {
        if (scheduledStopTask != null && !scheduledStopTask.isDone()) {
            scheduledStopTask.cancel(false)
            vmLogger.info(name + ', Previous VM stop task canceled.')
        }
    }

    private def releaseAllUsers(Object event) {
        users.each { key, user ->
            if (user != null) {
                user.connections.each { sessionId, connection ->
                    connection.webRtcEndpoint?.release()
                    if (connection.webSocketSession) {
                        connection.webSocketSession.send(event).subscribe({ arg -> '' })
                    }
                }
            }
        }
    }

}

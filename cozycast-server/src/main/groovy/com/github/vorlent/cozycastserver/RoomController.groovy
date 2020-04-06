package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Post
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured

import io.micronaut.websocket.CloseReason

import groovy.util.logging.Slf4j
import groovy.transform.CompileStatic

@Slf4j
@CompileStatic
@Controller("/api/room")
class RoomController {
    private RoomRegistry roomRegistry

    RoomController(RoomRegistry roomRegistry) {
        this.roomRegistry = roomRegistry
    }

    @Get("/")
    List rooms() {
        roomRegistry.all().collect { it ->
            [
                id: it.name,
                userCount: it.users.size()
            ]
        }
    }

    @Secured("ROLE_ADMIN")
    @Delete("/{name}")
    HttpResponse rooms(String name) {
        roomRegistry.delete(name)
        return HttpResponse.ok()
    }

    @Secured("ROLE_ADMIN")
    @Post("/{name}/kick/{sessionId}")
    HttpResponse kick(String name, String sessionId) {
        Room room = roomRegistry.getRoom(name)
        UserSession user = room?.users.get(sessionId)
        if(user) {
            room?.users.remove(sessionId)
            user.webSocketSession.send(new KickEvent(session: user.webSocketSession.getId()))
                .subscribe({arg -> ""})
            user.webSocketSession.close(CloseReason.POLICY_VIOLATION)
            user.release()
            log.info "Kicked user with session ${sessionId}"
            return HttpResponse.ok()
        } else {
            return HttpResponse.notFound()
        }
    }
}

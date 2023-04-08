package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.Post
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.utils.SecurityService
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission

import io.micronaut.websocket.CloseReason

import groovy.util.logging.Slf4j
import groovy.transform.CompileStatic

@Slf4j
@CompileStatic
@Controller("/api/room")
class RoomController {
    private RoomRegistry roomRegistry
    private SecurityService securityService

    RoomController(RoomRegistry roomRegistry, SecurityService securityService) {
        this.roomRegistry = roomRegistry
        this.securityService = securityService
    }

    @Get("/")
    List rooms() {
        Authentication authentication = securityService.getAuthentication().orElse(null)
        if (authentication != null){
            User.withTransaction {
                User user = User.get(authentication.getName())
                RoomPermission.withTransaction{
                        def invitedRooms = RoomPermission.where {
                            user == user && (banned == false && (invited == true || trusted == true))
                            }.list().collect { it.room }
                        
                        return roomRegistry.all().findAll { user.admin || !it.hidden_to_unauthorized || !it.inviteOnly || (it.name in invitedRooms) }.collect { accRoom ->
                            [
                                id: accRoom.name,
                                userCount: accRoom.users.size(),
                                accountOnly: accRoom.accountOnly,
                                inviteOnly: accRoom.inviteOnly,
                                open: user.admin || !accRoom.inviteOnly || (accRoom.name in invitedRooms) 
                            ]
                        }
                }
            }
        }
        else {
            log.info "No authentication"
            return roomRegistry.all().findAll { !it.hidden_to_unauthorized || !(it.accountOnly || it.inviteOnly)}.collect { accRoom ->
            [
                id: accRoom.name,
                userCount: accRoom.users.size(),
                accountOnly: accRoom.accountOnly,
                inviteOnly: accRoom.inviteOnly,
                open: !(accRoom.accountOnly || accRoom.inviteOnly)
            ]
        }
        }
    }

    @Secured("ROLE_ADMIN")
    @Delete("/{name}")
    HttpResponse rooms(String name) {
        roomRegistry.delete(name)
        return HttpResponse.ok()
    }
}

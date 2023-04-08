package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.QueryValue
import io.micronaut.http.annotation.Body
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Null
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import groovy.util.logging.Slf4j
import java.time.ZonedDateTime
import java.time.ZoneId
import javax.validation.Valid

import com.github.vorlent.cozycastserver.service.MessageSource
import com.github.vorlent.cozycastserver.service.RoomPermissionGormService
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission
import com.github.vorlent.cozycastserver.account.PermissionUpdate

@Secured(SecurityRule.IS_AUTHENTICATED)
@Slf4j
@Controller("/api/permission")
class PermissionController {

    private final MessageSource messageSource
    private final RoomPermissionGormService roomPermissionGormService

    PermissionController(MessageSource messageSource,RoomPermissionGormService roomPermissionGormService){
        this.messageSource = messageSource;
        this.roomPermissionGormService = roomPermissionGormService;
    }

    @Secured(["ROLE_ADMIN"])
    @Get("/all")
    ArrayList perms() {
        ArrayList perms = null
        RoomPermission.withTransaction {
            perms = RoomPermission.list(sort:"user")
        }
        return perms;
    }

    @Secured(["ROLE_ADMIN"])
    @Get("/{roomQuery}")
    ArrayList roomPerms(String roomQuery) {
        ArrayList perms = null
        RoomPermission.withTransaction {
            perms = RoomPermission.findAllByRoom(roomQuery)
        }
        return perms;
    }

    @Secured(["ROLE_ADMIN"])
    @Post("/")
    Object editPerms(@Body @Valid PermissionUpdate permission) {
        User.withTransaction{
            User user = User.get(permission.userId)
            if(user == null) return HttpResponse.status(HttpStatus.BAD_REQUEST)
            RoomPermission.withTransaction {
                RoomPermission perms = RoomPermission.findByUserAndRoom(user,permission.room)
                if(perms == null){
                    perms = new RoomPermission(
                        user: user,
                        room: permission.room,
                        invited: permission.invited,
                        banned: permission.banned,
                        remote_permission: permission.remote_permission,
                        image_permission: permission.image_permission,
                        trusted: permission.trusted,
                        bannedUntil : null
                    )
                } else{
                        perms.bannedUntil = permission.banned == perms.banned ? perms.bannedUntil : null
                        perms.invited = permission.invited
                        perms.banned = permission.banned
                        perms.remote_permission = permission.remote_permission
                        perms.image_permission = permission.image_permission
                        perms.trusted = permission.trusted
                }
                perms.save();
                return HttpResponse.status(HttpStatus.OK)
            }
        }
    }

    @Secured("ROLE_ADMIN")
    @Delete("/{roomQuery}/{userQuery}")
    Object deleteInvite(String roomQuery, String userQuery) {
        User.withTransaction {
            User user = User.get(userQuery)
            if (user) {
                RoomPermission.withCriteria {
                    eq('user', user)
                    eq('room', roomQuery)
                }.each {
                    it.delete()
                }
            }
        }
        return HttpResponse.status(HttpStatus.OK);
    }

    @Get("/")
    List<RoomPermission> permissions(Authentication authentication) {
        List<RoomPermission> perms = roomPermissionGormService.findAllByUserId(authentication.getName())
        return perms;
    }
}

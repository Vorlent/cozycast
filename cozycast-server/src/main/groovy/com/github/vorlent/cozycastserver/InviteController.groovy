package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Delete
import io.micronaut.http.annotation.QueryValue
import io.micronaut.core.annotation.Nullable
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

import com.github.vorlent.cozycastserver.domain.RoomInvite
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission

@Secured(SecurityRule.IS_AUTHENTICATED)
@Slf4j
@Controller("/api/invite")
class InviteController {

    public static final Integer TOKEN_EXPIRATION = 24*60*60*1000;


    @Secured("ROLE_ADMIN")
    @Delete("/{code}")
    Object deleteInvite(String code) {
        RoomInvite.withTransaction {
            RoomInvite.get(code).delete()
            return HttpResponse.status(HttpStatus.OK)
            }
    }

    @Get("/use/{code}")
    Object invite(String code, Authentication authentication) {
        RoomInvite.withTransaction {
            def inv = RoomInvite.get(code)
            if(!inv) {
                return HttpResponse.status(HttpStatus.NOT_FOUND)
            }
            if(inv.isExpired()) {
                inv.delete()
                return HttpResponse.status(HttpStatus.GONE)
            } else {
                inv.uses += 1
                User.withTransaction {
                    User user = User.get(authentication.getName())
                    RoomPermission.withTransaction{
                        RoomPermission rp = RoomPermission.findByUserAndRoom(user,inv.room);
                        if(rp == null){
                        new RoomPermission(
                            room: inv.room, 
                            user: user, 
                            invited: true,
                            remote_permission: inv.remote_permission,
                            image_permission: inv.image_permission,
                            inviteName: inv.inviteName
                            ).save(flush: true)
                        } else{
                            rp.invited= true;
                            rp.remote_permission = rp.remote_permission || inv.remote_permission;
                            rp.image_permission = rp.image_permission || inv.image_permission;
                            rp.inviteName = inv.inviteName;
                            rp.save(flush: true)
                        }
                    }
                }
                return HttpResponse.status(HttpStatus.OK)
            }
        }
    }

    @Secured("ROLE_ADMIN")
    @Get("/new")
    Object create(@NotBlank @QueryValue("room") String room,
        @QueryValue(value = "maxUses", defaultValue = "-1") Integer maxUses,
        @QueryValue(value = "expiration", defaultValue = "-1") Integer expiration,
        @QueryValue(value = "remotePermission", defaultValue = "false") boolean remotePermission,
        @QueryValue(value = "imagePermission", defaultValue = "false") boolean imagePermission,
        @Nullable @QueryValue(value = "inviteName") String inviteName) {

        def expirationDate = null
        if(expiration > 0) {
            expirationDate = ZonedDateTime.now(ZoneId.of("UTC"))
            expirationDate.plusMinutes(expiration)
        }
        if(maxUses < 0) {
            maxUses = null
        }
        RoomInvite.withTransaction {
            def code = RoomInvite.generateCode()
            def invite = new RoomInvite(
                room: room,
                maxUses: maxUses,
                expiration: expirationDate,
                remote_permission: remotePermission,
                image_permission: imagePermission,
                inviteName: inviteName)
            invite.id = code
            invite.save()
            return [code: invite.id]
        }
    }

    @Secured("ROLE_ADMIN")
    @Get("/all")
    ArrayList getInvites() {
        ArrayList invites = null
        RoomInvite.withTransaction {
            invites = RoomInvite.list()
        }
        return invites;
    }
}

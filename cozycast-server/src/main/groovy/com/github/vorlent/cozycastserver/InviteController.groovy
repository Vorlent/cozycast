package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.QueryValue
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

@Secured("isAnonymous()")
@Slf4j
@Controller("/api/invite")
class InviteController {

    public static final Integer TOKEN_EXPIRATION = 24*60*60*1000;

    @Secured(SecurityRule.IS_AUTHENTICATED)
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
                inv.save(flush: true)
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
                            image_permission: inv.image_permission
                            ).save(flush: true)
                        } else{
                            rp.invited= true;
                            rp.remote_permission = rp.remote_permission || inv.remote_permission;
                            rp.image_permission = rp.image_permission || inv.image_permission;
                            rp.save(flush: true)
                        }
                    }
                }
                return HttpResponse.status(HttpStatus.OK)
            }
        }
    }

    @Get("/perms")
    ArrayList perms() {
        ArrayList perms = null
        RoomPermission.withTransaction {
            perms = RoomPermission.list()
        }
        return perms;
    }

    @Secured("ROLE_ADMIN")
    @Get("/new")
    Object create(@NotBlank @QueryValue("room") String room,
        @QueryValue(value = "maxUses", defaultValue = "-1") Integer maxUses,
        @QueryValue(value = "expiration", defaultValue = "-1") Integer expiration) {

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
                expiration: expirationDate)
            invite.id = code
            invite.save()
            return [code: invite.id]
        }
    }

    @Get("/all")
    ArrayList invtes() {
        ArrayList invites = null
        RoomInvite.withTransaction {
            invites = RoomInvite.list()
        }
        return invites;
    }
}

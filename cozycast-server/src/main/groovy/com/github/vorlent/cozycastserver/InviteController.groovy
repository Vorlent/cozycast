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

import com.github.vorlent.cozycastserver.service.InviteService
import com.github.vorlent.cozycastserver.domain.RoomInvite
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission

@Secured(SecurityRule.IS_AUTHENTICATED)
@Slf4j
@Controller("/api/invite")
class InviteController {

    public static final Integer TOKEN_EXPIRATION = 24*60*60*1000;

    private InviteService inviteService;

    InviteController(InviteService inviteService){
        this.inviteService = inviteService;
    }

    @Secured("ROLE_ADMIN")
    @Delete("/{code}")
    Object deleteInvite(String code) {
        inviteService.deleteInvite(code);
        return HttpResponse.status(HttpStatus.OK);
    }

    @Get("/use/{code}")
    Object invite(String code, Authentication authentication) {
        if(inviteService.invite(code,authentication.getName()))
            return HttpResponse.status(HttpStatus.OK)
        return HttpResponse.status(HttpStatus.NOT_FOUND)        
    }

    @Secured(SecurityRule.IS_ANONYMOUS)
    @Get("/check/{code}")
    Object checkInvite(String code) {
        if(inviteService.checkInvite(code))
            return HttpResponse.status(HttpStatus.OK)
        return HttpResponse.status(HttpStatus.NOT_FOUND)   
    }

    @Secured("ROLE_ADMIN")
    @Get("/new")
    Object create(@NotBlank @QueryValue("room") String room,
        @QueryValue(value = "maxUses", defaultValue = "-1") Integer maxUses,
        @QueryValue(value = "expiration", defaultValue = "-1") Integer expiration,
        @QueryValue(value = "remotePermission", defaultValue = "false") boolean remotePermission,
        @QueryValue(value = "imagePermission", defaultValue = "false") boolean imagePermission,
        @Nullable @QueryValue(value = "inviteName") String inviteName) {
        
        String code = inviteService.create(room, maxUses, expiration, remotePermission, imagePermission, inviteName);
        return [code: code]
    }

    @Secured("ROLE_ADMIN")
    @Get("/all")
    ArrayList getInvites() {
        return inviteService.getInvites();
    }
}

package com.github.vorlent.cozycastserver

import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.QueryValue
import javax.validation.constraints.NotBlank
import javax.validation.constraints.Null
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.security.annotation.Secured
import io.micronaut.security.token.jwt.generator.JwtTokenGenerator
import groovy.util.logging.Slf4j
import java.time.ZonedDateTime
import java.time.ZoneId

import com.github.vorlent.cozycastserver.domain.RoomInvite

@Secured("isAnonymous()")
@Slf4j
@Controller("/api/invite")
class InviteController {

    final JwtTokenGenerator jwtTokenGenerator

    InviteController(JwtTokenGenerator jwtTokenGenerator) {
        this.jwtTokenGenerator = jwtTokenGenerator
    }

    public static final Integer TOKEN_EXPIRATION = 24*60*60*1000;

    @Get("/use/{code}")
    Object invite(String code) {
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
                //def token = jwtTokenGenerator.generateToken(new UserDetails(inv.id + inv.uses, ["ROLE_GUEST"]), TOKEN_EXPIRATION)
                return [ room: inv.room,
                         token: 'token' ]
            }
        }
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
}

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

import com.github.vorlent.cozycastserver.service.MessageSource
import com.github.vorlent.cozycastserver.service.RoomPermissionGormService
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission

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

    @Get("/all")
    ArrayList perms() {
        ArrayList perms = null
        RoomPermission.withTransaction {
            perms = RoomPermission.list()
        }
        return perms;
    }

    @Get("/")
    List<RoomPermission> permissions(Authentication authentication) {
        List<RoomPermission> perms = roomPermissionGormService.findAllByUserId(authentication.getName())
        return perms;
    }
}

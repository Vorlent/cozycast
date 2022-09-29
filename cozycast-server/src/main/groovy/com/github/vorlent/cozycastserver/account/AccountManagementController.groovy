package com.github.vorlent.cozycastserver.account

import com.github.vorlent.cozycastserver.account.AccountUpdate
import com.github.vorlent.cozycastserver.service.MessageSource
import com.github.vorlent.cozycastserver.service.RoomPermissionGormService
import com.github.vorlent.cozycastserver.domain.User
import com.github.vorlent.cozycastserver.domain.RoomPermission

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.Body
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import io.micronaut.validation.Validated

import javax.validation.Valid

import io.micronaut.security.annotation.Secured

import groovy.util.logging.Slf4j

import javax.validation.ConstraintViolationException
import io.micronaut.http.annotation.Error

@Slf4j
@Controller("/profile")
@Secured(SecurityRule.IS_AUTHENTICATED)
class AccountManagementController {

    private final MessageSource messageSource
    private final RoomPermissionGormService roomPermissionGormService

    AccountManagementController(MessageSource messageSource,RoomPermissionGormService roomPermissionGormService){
        this.messageSource = messageSource;
        this.roomPermissionGormService = roomPermissionGormService;
    }
    
    @Get("/all")
    @Secured(["ROLE_ADMIN"])
    User[] accounts() {
        ArrayList user = null
        User.withTransaction {
            user = User.list()
        }
        return user;
    }

    @Post("/")
    User updateProfile(Authentication authentication, @Body @Valid AccountUpdate account) {
        User user;
        User.withTransaction {
            user = User.get(authentication.getName())
            user.nickname = account.nickname;
            user.nameColor = account.nameColor;
            user.save()
        }
        return user;
    }

    @Error(exception = ConstraintViolationException) 
    HttpResponse<?> onInvalidJson(ConstraintViolationException ex) { // 
        HttpResponse.badRequest().body([errors: messageSource.violationsMessages(ex.constraintViolations) ])
    }

    @Get("/")
    User profile(Authentication authentication) {
        User user;
        User.withTransaction {
            user = User.get(authentication.getName());
        }
        return user;
    }
}
package com.github.vorlent.cozycastserver.account

import com.github.vorlent.cozycastserver.service.RegisterService
import com.github.vorlent.cozycastserver.service.MessageSource
import com.github.vorlent.cozycastserver.service.InviteService
import com.github.vorlent.cozycastserver.service.MiscService

import io.micronaut.http.HttpResponse
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Post
import io.micronaut.http.HttpStatus
import io.micronaut.http.HttpResponse
import io.micronaut.validation.Validated

import javax.validation.Valid

import io.micronaut.security.annotation.Secured


import groovy.util.logging.Slf4j

import javax.validation.ConstraintViolationException
import io.micronaut.http.annotation.Error

@Slf4j
@Secured("isAnonymous()")
@Validated
@Controller("/register")
class RegisterController {

    protected final RegisterService registerService
    protected final InviteService inviteService
    private final MessageSource messageSource
    private final MiscService miscService;
    

    RegisterController(RegisterService registerService, MessageSource messageSource, InviteService inviteService, MiscService miscService){
        this.registerService = registerService;
        this.messageSource = messageSource;
        this.inviteService = inviteService;
        this.miscService = miscService;
    }

    @Post
    HttpResponse<?> register(@Body @Valid Account account) {
        boolean validInvite = false;
        if(account.inviteCode){
            validInvite = inviteService.checkInvite(account.inviteCode)
        }
        if(miscService.getRegisterWithInviteOnly() && !validInvite){
            return HttpResponse.status(HttpStatus.UNAUTHORIZED);
        }
        boolean registerd = registerService.register(null,account.username, account.password, false);
        if(registerd) {
            if(validInvite){
                inviteService.invite(account.inviteCode, account.username);
            }
            return HttpResponse.ok();
        }
        else { 
            return HttpResponse.badRequest().body([errors: ["Username already taken"]]);
        }
    }

    @Error(exception = ConstraintViolationException) 
    HttpResponse<?> onInvalidJson(ConstraintViolationException ex) { // 
        HttpResponse.badRequest().body([errors: messageSource.violationsMessages(ex.constraintViolations) ])
    }
}

